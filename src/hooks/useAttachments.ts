import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../integrations/supabase/client";

export interface CardAttachment {
  id: string;
  board_id: string;
  card_id: string;
  name: string;
  description?: string | null;
  size: number;
  type: string;
  url: string;
  path: string;
  created_at: string;
  updated_at?: string;
}

export function useAttachments(boardId: string, cardId: string) {
  const qc = useQueryClient();
  const bucketName = (import.meta.env.VITE_ATTACHMENTS_BUCKET as string) || "attachments";
  const [relationMissing, setRelationMissing] = useState(false);

  const inferMimeType = (name: string, fallback: string): string => {
    if (fallback && fallback.trim().length > 0) return fallback;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml',
      mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mkv: 'video/x-matroska', avi: 'video/x-msvideo', m4v: 'video/x-m4v', mpg: 'video/mpeg', mpeg: 'video/mpeg', '3gp': 'video/3gpp',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', rtf: 'application/rtf',
      zip: 'application/zip', rar: 'application/x-rar-compressed',
      json: 'application/json', js: 'application/javascript', ts: 'application/typescript', xml: 'application/xml'
    };
    return map[ext] || 'application/octet-stream';
  };

  const listQuery = useQuery<CardAttachment[]>({
    queryKey: ["card-attachments", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_attachments")
        .select("id, board_id, card_id, name, description, size, type, url, path, created_at, updated_at")
        .eq("card_id", cardId)
        .order("created_at", { ascending: false });
      if (error) {
        const code = (error as { code?: string }).code;
        if (code === "42P01") {
          setRelationMissing(true);
          return [] as CardAttachment[];
        }
        throw error;
      }
      setRelationMissing(false);
      const rows = (data || []) as CardAttachment[];
      if (rows.length > 0) return rows;
      const prefix = `boards/${boardId}/cards/${cardId}`;
      const candidates = [bucketName, 'attachments', 'perfil'];
      const seen = new Set<string>();
      const out: CardAttachment[] = [];
      for (const bName of candidates) {
        const b = supabase.storage.from(bName);
        const listing = await b.list(prefix, { limit: 200 });
        if (listing.error || !listing.data) continue;
        for (const item of listing.data) {
          const path = `${prefix}/${item.name}`;
          if (seen.has(path)) continue;
          seen.add(path);
          const { data: pub } = b.getPublicUrl(path);
          const url = pub?.publicUrl || '';
          out.push({
            id: path,
            board_id: boardId,
            card_id: cardId,
            name: item.name,
            description: null,
            size: (item as any)?.metadata?.size ?? 0,
            type: inferMimeType(item.name, ''),
            url,
            path,
            created_at: new Date().toISOString(),
            updated_at: undefined,
          });
        }
      }
      return out;
    },
    staleTime: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results: CardAttachment[] = [];
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ATTACHMENTS;

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        let publicUrl = "";

        // Tentar upload para Cloudinary
        if (cloudName && uploadPreset) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'kanban/attachments');
            formData.append('public_id', `${boardId}_${cardId}_${Date.now()}_${safeName}`);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
              { method: 'POST', body: formData }
            );

            if (response.ok) {
              const data = await response.json();
              publicUrl = data.secure_url;
            }
          } catch (err) {
            console.warn('Cloudinary upload failed, falling back to Supabase:', err);
          }
        }

        // Fallback para Supabase se Cloudinary falhar
        if (!publicUrl) {
          const path = `boards/${boardId}/cards/${cardId}/${Date.now()}_${safeName}`;
          const bucket = supabase.storage.from(bucketName);
          const up = await bucket.upload(path, file, { contentType: file.type });
          if (up.error) throw up.error;
          const { data: pub } = bucket.getPublicUrl(path);
          publicUrl = pub?.publicUrl || "";
          if (!publicUrl) {
            const signed = await bucket.createSignedUrl(path, 60 * 60 * 24 * 7);
            publicUrl = signed.data?.signedUrl || "";
          }
        }

        // Inserir no banco
        const insert = await supabase
          .from("card_attachments")
          .insert({
            board_id: boardId,
            card_id: cardId,
            name: safeName,
            size: file.size,
            type: file.type,
            url: publicUrl,
            path: publicUrl.includes('cloudinary') ? `cloudinary://${safeName}` : `boards/${boardId}/cards/${cardId}/${Date.now()}_${safeName}`,
          })
          .select("id, board_id, card_id, name, description, size, type, url, path, created_at, updated_at")
          .single();
        if (insert.error) throw insert.error;
        results.push(insert.data as CardAttachment);
      }
      return results;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-attachments", cardId] }),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("card_attachments").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-attachments", cardId] }),
  });

  const describeMutation = useMutation({
    mutationFn: async ({ id, description }: { id: string; description: string }) => {
      const { error } = await supabase.from("card_attachments").update({ description }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-attachments", cardId] }),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => {
      if (path.startsWith("link/")) {
        const { error } = await supabase.from("card_attachments").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const bucket = supabase.storage.from(bucketName);
      const rem = await bucket.remove([path]);
      if (rem.error) throw rem.error;
      const { error } = await supabase.from("card_attachments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-attachments", cardId] }),
  });

  const addLinkMutation = useMutation({
    mutationFn: async ({ url, name }: { url: string; name?: string }) => {
      const now = Date.now();
      const path = `link/${now}`;
      const display = (name || url);
      const { error } = await supabase
        .from("card_attachments")
        .insert({
          board_id: boardId,
          card_id: cardId,
          name: display,
          description: null,
          size: 0,
          type: "link/url",
          url,
          path,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-attachments", cardId] }),
  });

  return {
    attachments: listQuery.data || [],
    relationMissing,
    uploading: uploadMutation.isPending,
    upload: (files: File[]) => uploadMutation.mutateAsync(files),
    rename: (id: string, name: string) => renameMutation.mutateAsync({ id, name }),
    setDescription: (id: string, description: string) => describeMutation.mutateAsync({ id, description }),
    remove: (id: string, path: string) => removeMutation.mutateAsync({ id, path }),
    addLink: (url: string, name?: string) => addLinkMutation.mutateAsync({ url, name }),
  };
}
