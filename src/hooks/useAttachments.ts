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
      return (data || []) as CardAttachment[];
    },
    staleTime: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results: CardAttachment[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `boards/${boardId}/cards/${cardId}/${Date.now()}_${safeName}`;
        const bucket = supabase.storage.from(bucketName);
        const up = await bucket.upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        const { data: pub } = bucket.getPublicUrl(path);
        let publicUrl = pub?.publicUrl || "";
        if (!publicUrl) {
          const signed = await bucket.createSignedUrl(path, 60 * 60 * 24 * 7);
          publicUrl = signed.data?.signedUrl || "";
        }
        const insert = await supabase
          .from("card_attachments")
          .insert({
            board_id: boardId,
            card_id: cardId,
            name: safeName,
            size: file.size,
            type: file.type,
            url: publicUrl,
            path,
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
      const bucket = supabase.storage.from(bucketName);
      const rem = await bucket.remove([path]);
      if (rem.error) throw rem.error;
      const { error } = await supabase.from("card_attachments").delete().eq("id", id);
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
  };
}
