import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import { MessageSquare, Clock, User, Send, Calendar, Tag, Paperclip, ArrowRight, Plus, Image, CalendarDays, Users, Palette, Check, Trash, MoreHorizontal, FileText, FileArchive, Video, Music, FileCode, File, Link } from "lucide-react";

import { Card as TCard, Label as TLabel, LabelColor, Comment, Member } from "../../state/kanbanTypes";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBoardsStore } from "../../state/boards/store";
import { useBoardDetails } from "../../hooks/useBoards";
import { useComments } from "../../hooks/useComments";
import { useActivities } from "../../hooks/useActivities";
import { supabase } from "../../integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "../../integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/use-toast";
import { MemberSelect } from "./MemberSelect";
import { useAuth } from "../../hooks/useAuth";
import { ImageViewerDialog } from "./ImageViewerDialog";
import LazyImage from "../ui/lazy-image";
import { postWebhook } from "../../lib/webhook";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { useAttachments } from "../../hooks/useAttachments";
import { Progress } from "../ui/progress";
import AttachmentDialog from "./AttachmentDialog";

const labelColorClass: Record<LabelColor, string> = {
  green: "bg-[hsl(var(--label-green))] text-white",
  yellow: "bg-[hsl(var(--label-yellow))] text-black",
  orange: "bg-[hsl(var(--label-orange))] text-white", 
  red: "bg-[hsl(var(--label-red))] text-white",
  purple: "bg-[hsl(var(--label-purple))] text-white",
  blue: "bg-[hsl(var(--label-blue))] text-white",
};

const labelBgClass: Record<LabelColor, string> = {
  green: "bg-[hsl(var(--label-green))]",
  yellow: "bg-[hsl(var(--label-yellow))]",
  orange: "bg-[hsl(var(--label-orange))]",
  red: "bg-[hsl(var(--label-red))]",
  purple: "bg-[hsl(var(--label-purple))]",
  blue: "bg-[hsl(var(--label-blue))]",
};

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  card: TCard;
}

export function CardModal({ open, onOpenChange, boardId, card }: CardModalProps) {
  const { updateCard, deleteCard: deleteCardMutation, deleteCardAsync } = useBoardDetails(boardId);
  const deleteCard = useBoardsStore((s) => s.deleteCard);
  const addComment = useBoardsStore((s) => s.addComment);
  const addActivity = useBoardsStore((s) => s.addActivity);
  const board = useBoardsStore((s) => s.boards[boardId]);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sb = supabase as SupabaseClient;
  const [boardOwnerName, setBoardOwnerName] = useState<string | null>(null);
  
  // Hook para gerenciar comentários do Supabase
  const { 
    comments: supabaseComments, 
    addComment: addSupabaseComment, 
    isAddingComment 
  } = useComments(card.id);

  const errorMessage = (err: unknown) => {
    try {
      const anyErr = err as { message?: string; error?: { message?: string } };
      return anyErr?.message || anyErr?.error?.message || String(err);
    } catch {
      return 'Erro desconhecido';
    }
  };

  // Check if this is the "Solicitação de Arte" board (preserve original layout)
  const isSolicitacaoArte = board?.id === "b_q1lk2c5be4" || board?.isTemplate;

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState<string>(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
  const [labels, setLabels] = useState<TLabel[]>(card.labels || []);
  const [members, setMembers] = useState<Member[]>(card.members || []);
  const [custom, setCustom] = useState<Record<string, unknown>>(card.custom || {});
  const [coverImages, setCoverImages] = useState<string[]>(card.coverImages || []);
  const [coverColor, setCoverColor] = useState<LabelColor | undefined>(card.coverColor);
  const [newComment, setNewComment] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [selectedTagColor, setSelectedTagColor] = useState<LabelColor>("blue");
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  // Timers para autosave (debounce por campo)
  const titleTimerRef = useRef<number | null>(null);
  const descTimerRef = useRef<number | null>(null);
  const coverImagesTimerRef = useRef<number | null>(null);

  // Funções para flush imediato de autosave ao fechar o modal
  const flushTitleAutosave = () => {
    if (titleTimerRef.current) {
      window.clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
      updateCard({ cardId: card.id, updates: { title: (title || '').trim() || 'Sem título' } });
    }
  };
  const flushDescriptionAutosave = () => {
    if (descTimerRef.current) {
      window.clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
      updateCard({ cardId: card.id, updates: { description: (description || '').trim() } });
    }
  };
  const flushCoverImagesAutosave = () => {
    updateCard({ cardId: card.id, updates: { cover_images: coverImages } });
  };

  // Ao fechar o modal, garantir que o último estado seja persistido
  useEffect(() => {
    if (!open) {
      flushCoverImagesAutosave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isHexColor = (val: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);

  const attachmentIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <Image className="h-4 w-4 text-blue-600" />;
    if (mime.startsWith('video/')) return <Video className="h-4 w-4 text-purple-600" />;
    if (mime.startsWith('audio/')) return <Music className="h-4 w-4 text-emerald-600" />;
    if (mime.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (mime.includes('zip') || mime.includes('rar')) return <FileArchive className="h-4 w-4 text-orange-600" />;
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('typescript') || mime.includes('xml')) return <FileCode className="h-4 w-4 text-slate-600" />;
    if (mime === 'link/url' || mime.includes('link')) return <Link className="h-4 w-4 text-sky-600" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const friendlyTypeLabel = (mime: string) => {
    if (mime.startsWith('image/')) return 'Imagem';
    if (mime.startsWith('video/')) return 'Vídeo';
    if (mime.startsWith('audio/')) return 'Áudio';
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('zip') || mime.includes('rar')) return 'Compactado';
    if (mime.includes('msword') || mime.includes('officedocument') || mime.includes('rtf')) return 'Documento';
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('typescript') || mime.includes('xml')) return 'Código';
    if (mime === 'link/url' || mime.includes('link')) return 'Link';
    return 'Arquivo';
  };

  const handleDownload = (url: string, name: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  };

  // State for expandable sections (clean interface only)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAttachments, setShowAttachments] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const { attachments: storedAttachments, relationMissing, uploading, upload, rename, setDescription: setAttachmentDescription, remove } = useAttachments(boardId, card.id);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  
  const [editingName, setEditingName] = useState<Record<string, string>>({});
  const [editingDesc, setEditingDesc] = useState<Record<string, string>>({});

  type FilterKey = 'all' | 'image' | 'video' | 'audio' | 'doc' | 'zip' | 'code' | 'link';
  type SortBy = 'name' | 'size' | 'date';
  type SortDir = 'asc' | 'desc';
  type AttachmentItem = {
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
  };

  const [filterState, setFilterState] = useState<FilterKey>('all');
  const [sortByState, setSortByState] = useState<SortBy>('date');
  const [sortDirState, setSortDirState] = useState<SortDir>('desc');

  const filterFn = React.useCallback((t: string) => {
    switch (filterState) {
      case 'image': return t.startsWith('image/');
      case 'video': return t.startsWith('video/');
      case 'audio': return t.startsWith('audio/');
      case 'doc': return t.includes('pdf') || t.includes('msword') || t.includes('officedocument') || t.includes('rtf');
      case 'zip': return t.includes('zip') || t.includes('rar');
      case 'code': return t.includes('json') || t.includes('javascript') || t.includes('typescript') || t.includes('xml');
      case 'link': return t === 'link/url' || t.includes('link');
      default: return true;
    }
  }, [filterState]);

  const visibleAttachments = React.useMemo(() => {
    const arr = (storedAttachments || []).filter(a => filterFn(a.type));
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortByState === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortByState === 'size') cmp = (a.size || 0) - (b.size || 0);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDirState === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [storedAttachments, filterFn, sortByState, sortDirState]);

  
  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description || "");
      setDueDate(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
      setLabels(card.labels || []);
      setMembers(card.members || []);
      setCustom(card.custom || {});
      setCoverImages(card.coverImages || []);
      setCoverColor(card.coverColor);
    }
  }, [open, card]);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const handleSave = async () => {
    // Validation for all boards - check required custom fields
    const requiredFields = board?.customFields?.filter(f => f.required) || [];
    const requiredMissing = requiredFields.some(field => {
      const value = custom[field.id];
      return !value || (typeof value === "string" && value.trim() === "");
    });
    
    if (requiredMissing) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const previousDue = card.dueDate;
    const nextDue = dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : undefined;

    updateCard({
      cardId: card.id,
      updates: {
        title: title.trim() || "Sem título",
        description: description.trim(),
        // useBoards.updateCard espera campos snake_case do Card do Supabase
        due_date: nextDue,
        cover_color: coverColor,
        cover_images: coverImages,
      }
    });

    // Registrar atividade de alteração/definição de prazo
    try {
      const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || "Usuário";
      if (nextDue && !previousDue) {
        const desc = `definiu o prazo para ${format(parseISO(nextDue), "dd/MM/yyyy")}`;
        addActivity(boardId, card.id, authorName, 'due_date_set', desc);
        await sb.from('card_activities').insert({
          board_id: boardId,
          card_id: card.id,
          user_id: user?.id,
          type: 'due_date_set',
          description: desc,
        });
        toast({ title: 'Atividade registrada', description: 'Prazo definido com sucesso.' });
        // Garantir que a lista de atividades atualize imediatamente
        queryClient.invalidateQueries({ queryKey: ["card-activities", card.id] });
      } else if (nextDue && previousDue && nextDue !== previousDue) {
        const desc = `alterou o prazo para ${format(parseISO(nextDue), "dd/MM/yyyy")}`;
        addActivity(boardId, card.id, authorName, 'due_date_changed', desc);
        await sb.from('card_activities').insert({
          board_id: boardId,
          card_id: card.id,
          user_id: user?.id,
          type: 'due_date_changed',
          description: desc,
        });
        toast({ title: 'Atividade registrada', description: 'Prazo alterado com sucesso.' });
        // Garantir que a lista de atividades atualize imediatamente
        queryClient.invalidateQueries({ queryKey: ["card-activities", card.id] });
      }
    } catch (activityErr) {
      console.warn('Falha ao registrar atividade de prazo:', activityErr);
      toast({ title: 'Falha ao registrar atividade', description: errorMessage(activityErr), variant: 'destructive' });
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCardAsync(card.id);
      toast({ title: 'Card excluído', description: 'O card foi excluído com sucesso.' });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Não foi possível excluir', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerAttachmentUpload = () => {
    setShowAttachments(true);
    setAttachmentsDialogOpen(true);
  };

  const addLabel = async () => {
    const name = newTagName.trim();
    if (!name) return;

    // Mapear cores conhecidas para valores CSS consistentes; fallback para o valor selecionado
    const labelColorValues: Record<string, string> = {
      green: 'hsl(var(--label-green))',
      yellow: 'hsl(var(--label-yellow))',
      orange: 'hsl(var(--label-orange))',
      red: 'hsl(var(--label-red))',
      purple: 'hsl(var(--label-purple))',
      blue: 'hsl(var(--label-blue))',
    };
    const cssColor = labelColorValues[selectedTagColor as keyof typeof labelColorValues] || selectedTagColor;

    // Persistir no Supabase
    const { data, error } = await supabase
      .from('card_labels')
      .insert({ card_id: card.id, name, color: cssColor })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao adicionar tag', description: error.message, variant: 'destructive' });
      return;
    }

    // Atualizar estado local com o ID real do Supabase
    const label: TLabel = { id: data.id, name: data.name, color: data.color };
    setLabels((prev) => [...prev, label]);
    setNewTagName("");

    // Invalidate/refetch labels para refletir no board
    queryClient.invalidateQueries({ queryKey: ['card-labels', boardId] });

    // Webhook: label adicionada ao card
    try {
      await postWebhook({
        event: 'label_added',
        boardId,
        cardId: card.id,
        label,
      });
    } catch (e) {
      console.warn('[Webhook] erro ao enviar label_added:', e);
    }
  };

  const removeLabel = async (id: string) => {
    // Otimista: remover do estado imediatamente
    setLabels((prev) => prev.filter((l) => l.id !== id));

    const { error } = await supabase
      .from('card_labels')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao remover tag', description: error.message, variant: 'destructive' });
    }

    // Invalidate/refetch labels para refletir no board
    queryClient.invalidateQueries({ queryKey: ['card-labels', boardId] });

    // Webhook: label removida do card
    try {
      await postWebhook({
        event: 'label_removed',
        boardId,
        cardId: card.id,
        labelId: id,
      });
    } catch (e) {
      console.warn('[Webhook] erro ao enviar label_removed:', e);
    }
  };



  const handleAddComment = () => {
    const content = newComment.trim();
    if (!content) return;

    // Usar o hook do Supabase para adicionar comentário
    addSupabaseComment(content);
    setNewComment("");

    // Auto-scroll para o final dos comentários
    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    // Envia com Enter; permite quebra de linha com Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
    // Atalho extra: Ctrl/Cmd+Enter também envia
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCoverImages((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Clear the input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const next = (coverImages || []).filter((_, i) => i !== index);
    setCoverImages(next);
    updateCard({ cardId: card.id, updates: { cover_images: next } });
  };

  const MAX_FILE_SIZE = 13 * 1024 * 1024; // 13 MB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const inferMimeType = (name: string, fallback: string): string => {
    if (fallback && fallback.trim().length > 0) return fallback;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml',
      mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mkv: 'video/x-matroska',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', rtf: 'application/rtf',
      zip: 'application/zip', rar: 'application/x-rar-compressed',
      json: 'application/json', js: 'application/javascript', ts: 'application/typescript', xml: 'application/xml'
    };
    return map[ext] || 'application/octet-stream';
  };

  const ATTACHMENTS_BUCKET = (import.meta.env.VITE_ATTACHMENTS_BUCKET as string) || 'attachments';
  const PROFILE_BUCKET = (import.meta.env.VITE_PROFILE_BUCKET as string) || 'perfil';

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingAttachment(true);
    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "Arquivo muito grande", description: `O limite é de 13 MB. ${file.name} tem ${formatBytes(file.size)}.`, variant: "destructive" });
          continue;
        }
        const safeName = sanitizeFileName(file.name);
        const path = `boards/${boardId}/cards/${card.id}/${Date.now()}_${safeName}`;
        let uploadOk = false;
        let usedBucket = ATTACHMENTS_BUCKET;
        let publicUrl = '';
        for (const b of [ATTACHMENTS_BUCKET, 'attachments', PROFILE_BUCKET]) {
          const bucket = sb.storage.from(b);
          const { error: uploadErr } = await bucket.upload(path, file, { contentType: file.type });
          if (!uploadErr) {
            usedBucket = b;
            const { data: pub } = bucket.getPublicUrl(path);
            publicUrl = pub?.publicUrl || '';
            if (!publicUrl) {
              try {
                const { data: signed } = await bucket.createSignedUrl(path, 60 * 60 * 24 * 7);
                publicUrl = signed?.signedUrl || '';
              } catch (_) { publicUrl = publicUrl || ''; }
            }
            uploadOk = true;
            break;
          }
        }
        if (!uploadOk) {
          toast({ title: "Falha ao enviar arquivo", description: `Bucket '${ATTACHMENTS_BUCKET}' ausente. Defina VITE_ATTACHMENTS_BUCKET ou crie o bucket e torne-o público.`, variant: "destructive" });
          continue;
        }

        // Registrar atividade de arquivo adicionado
        const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || "Usuário";
        const mime = inferMimeType(safeName, file.type);
        const desc = `${safeName}|${file.size}|${mime}|${publicUrl}|${path}`;
        addActivity(boardId, card.id, authorName, 'attachment_added', `enviou um arquivo: ${safeName}`);
        await sb.from('card_activities').insert({
          board_id: boardId,
          card_id: card.id,
          user_id: user?.id,
          type: 'attachment_added',
          description: desc,
        });
        await sb.from('card_attachments').insert({
          board_id: boardId,
          card_id: card.id,
          name: safeName,
          description: null,
          size: file.size,
          type: mime,
          url: publicUrl,
          path,
        });
        // Atualizar lista imediatamente
        queryClient.invalidateQueries({ queryKey: ["card-activities", card.id] });
        queryClient.invalidateQueries({ queryKey: ["card-attachments", card.id] });
        toast({ title: "Arquivo enviado", description: safeName });
        if (mime.startsWith('image/')) {
          setCoverFromUrl(publicUrl);
        }
      }
    } catch (err) {
      toast({ title: "Erro ao enviar arquivo", description: errorMessage(err), variant: "destructive" });
    } finally {
      setIsUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleAttachmentRemove = async (path: string, name: string) => {
    try {
      let removed = false;
      for (const b of [ATTACHMENTS_BUCKET, 'attachments', PROFILE_BUCKET]) {
        const bucket = sb.storage.from(b);
        const { error: remErr } = await bucket.remove([path]);
        if (!remErr) { removed = true; break; }
      }
      if (!removed) {
        toast({ title: "Erro ao remover arquivo", description: "Falha ao remover do Storage", variant: "destructive" });
        return;
      }
      const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || "Usuário";
      addActivity(boardId, card.id, authorName, 'attachment_removed', `removeu o arquivo: ${name}`);
      await sb.from('card_activities').insert({
        board_id: boardId,
        card_id: card.id,
        user_id: user?.id,
        type: 'attachment_removed',
        description: name,
      });
      queryClient.invalidateQueries({ queryKey: ["card-activities", card.id] });
      toast({ title: "Arquivo removido", description: name });
    } catch (err) {
      toast({ title: "Erro ao remover arquivo", description: errorMessage(err), variant: "destructive" });
    }
  };

  const clearCover = () => {
    setCoverImages([]);
    setCoverColor(undefined);
    // Atualizar o card no Supabase (remover capa)
    updateCard({
      cardId: card.id,
      updates: { cover_color: undefined }
    });
  };

  const setCoverFromUrl = (url: string) => {
    const prev = coverImages || [];
    const next = [url, ...prev.filter((u) => u !== url)];
    setCoverImages(next);
    updateCard({ cardId: card.id, updates: { cover_images: next } });
    toast({ title: "Capa definida", description: "Imagem definida como capa do cartão." });
  };

  const isCoverUrl = (url: string) => {
    return (coverImages || [])[0] === url;
  };

  // Autosave: título (debounced)
  const scheduleTitleAutosave = (value: string) => {
    if (titleTimerRef.current) window.clearTimeout(titleTimerRef.current);
    titleTimerRef.current = window.setTimeout(() => {
      updateCard({
        cardId: card.id,
        updates: { title: (value || '').trim() || 'Sem título' }
      });
    }, 600);
  };

  // Autosave: descrição (debounced)
  const scheduleDescriptionAutosave = (value: string) => {
    if (descTimerRef.current) window.clearTimeout(descTimerRef.current);
    descTimerRef.current = window.setTimeout(() => {
      updateCard({
        cardId: card.id,
        updates: { description: (value || '').trim() }
      });
    }, 600);
  };

  

  // Autosave: data de vencimento (imediato)
  const handleDueDateChange = (value: string) => {
    setDueDate(value);
    const iso = value ? new Date(`${value}T00:00:00`).toISOString() : null;
    updateCard({ cardId: card.id, updates: { due_date: iso as unknown as string | null } });
  };

  // Autosave: campos customizados (upsert em card_custom_values)
  const saveCustomValue = async (fieldId: string, value: Json) => {
    try {
      await sb
        .from('card_custom_values')
        .upsert(
          { card_id: card.id, custom_field_id: fieldId, value },
          { onConflict: 'card_id,custom_field_id' }
        );
    } catch (err) {
      console.warn('Falha ao salvar campo customizado:', err);
    }
  };

  const formatCommentTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch {
      return "agora";
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'card_created':
        return <Plus className="size-4 text-green-500" />;
      case 'card_moved':
        return <ArrowRight className="size-4 text-blue-500" />;
      case 'card_completed':
        return <Check className="size-4 text-green-600" />;
      case 'card_uncompleted':
        return <Check className="size-4 text-gray-500" />;
      case 'member_added':
      case 'member_removed':
        return <User className="size-4 text-purple-500" />;
      case 'due_date_set':
      case 'due_date_changed':
        return <Calendar className="size-4 text-orange-500" />;
      case 'due_date_cleared':
        return <CalendarDays className="size-4 text-gray-500" />;
      case 'label_added':
      case 'label_removed':
        return <Tag className="size-4 text-indigo-500" />;
      case 'priority_changed':
        return <Tag className="size-4 text-pink-500" />;
      case 'description_updated':
        return <MessageSquare className="size-4 text-teal-500" />;
      case 'attachment_added':
      case 'attachment_removed':
        return <Paperclip className="size-4 text-gray-500" />;
      case 'cover_color_set':
        return <Palette className="size-4 text-violet-500" />;
      case 'cover_images_updated':
        return <Image className="size-4 text-blue-500" />;
      default:
        return <div className="size-4 rounded-full bg-gray-300" />;
    }
  };

  const parseActivity = (content: string) => {
    const [type, description] = content.split(':');
    return { type, description };
  };

  // Preferir o card do store (reativo) para refletir novos comentários imediatamente
  const storeCard = React.useMemo(() => {
    if (!board) return undefined;
    for (const lid of Object.keys(board.cardsByList)) {
      const found = (board.cardsByList[lid] || []).find((c) => c.id === card.id);
      if (found) return found;
    }
    return undefined;
  }, [board, card.id]);

  // Converter comentários do Supabase para o formato local
  const convertedSupabaseComments: Comment[] = supabaseComments.map(comment => ({
    id: comment.id,
    cardId: comment.card_id,
    author: comment.profiles?.full_name || 'Usuário',
    content: comment.content,
    timestamp: comment.created_at || new Date().toISOString(),
    type: 'comment' as const,
    avatarUrl: comment.profiles?.avatar_url || undefined,
  }));

  // Buscar atividades persistidas no Supabase
  const { activities: supabaseActivities } = useActivities(card.id);
  // Atividades locais do store (fallback imediato)
  const localActivities: Comment[] = (storeCard?.comments || []).filter((c) => c.type === 'activity');
  // Conteúdos das atividades do Supabase (memoizados junto com mergedActivities)
  // Buscar nome do criador do board consultando o Supabase
  useEffect(() => {
    const fetchOwnerName = async () => {
      try {
        // Buscar o owner_id do board via tabela boards
        const { data: boardRow, error: boardErr } = await sb
          .from('boards')
          .select('owner_id')
          .eq('id', boardId)
          .maybeSingle();
        if (boardErr) { setBoardOwnerName(null); return; }
        const ownerId = (boardRow as { owner_id?: string } | null)?.owner_id;
        if (!ownerId) { setBoardOwnerName(null); return; }
        const { data: profileRow } = await sb
          .from('profiles')
          .select('full_name, email')
          .eq('id', ownerId)
          .maybeSingle();
        const name = (profileRow?.full_name as string) || (profileRow?.email as string) || null;
        setBoardOwnerName(name);
      } catch {
        setBoardOwnerName(null);
      }
    };
    if (open) fetchOwnerName();
  }, [open, boardId, sb]);

  const boardCreatedActivity: Comment | null = React.useMemo(() => {
    const createdAt = board?.createdAt;
    if (!createdAt) return null;
    const author = boardOwnerName || 'Usuário';
    const when = format(parseISO(createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
    return {
      id: `activity_board_created_${boardId}`,
      cardId: card.id,
      author,
      content: `board_created:criou o board em ${when}`,
      timestamp: createdAt,
      type: 'activity',
      avatarUrl: undefined,
    } as Comment;
  }, [board?.createdAt, boardOwnerName, boardId, card.id]);

  const mergedActivities = React.useMemo(() => {
    const supabaseContents = new Set(supabaseActivities.map((a) => a.content));
    return [
      ...(boardCreatedActivity ? [boardCreatedActivity] : []),
      ...supabaseActivities,
      ...localActivities.filter((c) => !supabaseContents.has(c.content)),
    ];
  }, [boardCreatedActivity, supabaseActivities, localActivities]);

  const attachments = React.useMemo(() => {
    const list: { name: string; size: number; type: string; url: string; path: string; addedAt?: string }[] = [];
    for (const a of mergedActivities) {
      const { type, description } = parseActivity(a.content);
      if (type === 'attachment_added') {
        const parts = description.split('|');
        if (parts.length >= 5) {
          const [name, sizeStr, mime, url, path] = parts;
          const size = Number(sizeStr) || 0;
          list.push({ name, size, type: mime, url, path, addedAt: a.timestamp });
        }
      }
    }
    return list;
  }, [mergedActivities]);

  const dataset: AttachmentItem[] = relationMissing ? attachments.map((a) => ({
    id: a.path,
    board_id: boardId,
    card_id: card.id,
    name: a.name,
    description: null,
    size: a.size,
    type: a.type,
    url: a.url,
    path: a.path,
    created_at: new Date().toISOString(),
  })) : (visibleAttachments as unknown as AttachmentItem[]);

  const imageAttachments: AttachmentItem[] = React.useMemo(() => {
    return dataset.filter((a) => a.type?.startsWith("image/"));
  }, [dataset]);

  const galleryImages: AttachmentItem[] = React.useMemo(() => {
    if (imageAttachments.length > 0) return imageAttachments;
    const srcs = coverImages || [];
    return srcs.map((url, idx) => ({
      id: `cover_${idx}`,
      board_id: boardId,
      card_id: card.id,
      name: `capa_${idx + 1}`,
      description: null,
      size: 0,
      type: 'image/*',
      url,
      path: url,
      created_at: new Date().toISOString(),
    }));
  }, [imageAttachments, coverImages, boardId, card.id]);

  const fileAttachments: AttachmentItem[] = React.useMemo(() => {
    return dataset.filter((a) => !a.type?.startsWith('image/'));
  }, [dataset]);

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'image', label: 'Imagens' },
    { key: 'video', label: 'Vídeos' },
    { key: 'doc', label: 'Documentos' },
    { key: 'audio', label: 'Áudio' },
    { key: 'zip', label: 'Compactados' },
    { key: 'code', label: 'Código' },
    { key: 'link', label: 'Links' },
  ];

  const comments = [
    ...mergedActivities,
    ...convertedSupabaseComments,
  ];
  const commentsCount = comments.filter((c) => c.type === "comment").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        className="sm:max-w-5xl w-[95vw] max-h-[85vh] flex flex-col relative"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute right-12 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 inline-flex items-center justify-center h-8 w-8"
              aria-label="Opções do cartão"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="z-[100]">
            <DropdownMenuItem
              onClick={handleDelete}
              onSelect={(e) => { e.preventDefault(); handleDelete(); }}
              className="text-red-600"
            >
              Excluir cartão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar cartão
            {commentsCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {commentsCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Conditional Rendering Based on Board Type */}
          {isSolicitacaoArte ? (
            /* Original Layout for "Solicitação de Arte" */
            <>
              {/* Left Column - Form (Original) */}
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  

                  {/* 1. Título */}
                  <div>
                    <label className="text-sm text-muted-foreground">Título *</label>
                    <Input
                      value={title}
                      onChange={(e) => { const v = e.target.value; setTitle(v); }}
                      placeholder="Título do cartão"
                    />
                  </div>

                  {/* Arquivos */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">Arquivos</label>
                      <div className="text-xs text-muted-foreground">Limite: 13 MB por arquivo</div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {relationMissing && (
                        <div className="text-xs text-muted-foreground">Modo compatível: aplique a migration de `card_attachments` para habilitar filtros, renomear e descrição completos.</div>
                      )}
                      <div
                        className="flex items-center justify-center w-full h-12 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files || []); if (files.length) { if (relationMissing) { const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>; handleAttachmentUpload(fakeEvent); } else { upload(files); } } }}
                        onClick={() => { const el = document.getElementById('file-upload') as HTMLInputElement | null; el?.click(); }}
                      >
                        <input id="file-upload" type="file" multiple className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []); if (files.length) { if (relationMissing) { handleAttachmentUpload(e); } else { upload(files); } } }} />
                        <div className="text-center">
                          <div className="text-muted-foreground text-sm flex items-center gap-2 justify-center"><Paperclip className="h-4 w-4" /> Arraste aqui ou clique para anexar (máx. 13 MB)</div>
                        </div>
                      </div>
                      {uploading && (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">Enviando arquivos...</div>
                          <Progress value={90} />
                        </div>
                      )}
                      {dataset.filter((a) => a.type.startsWith('image/')).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Imagens</h4>
                          <div className="space-y-2">
                            {dataset.filter((a) => a.type.startsWith('image/')).map((att) => (
                              <div key={att.path} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative h-8 w-8 rounded overflow-hidden border bg-muted shrink-0">
                                    <button
                                      type="button"
                                      className="absolute inset-0"
                                      onClick={(e) => { e.stopPropagation(); setViewerSrc(att.url); setViewerOpen(true); }}
                                      aria-label="Visualizar imagem"
                                    />
                                    <LazyImage src={att.url} alt={att.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <a href={att.url} target="_blank" rel="noreferrer" className="truncate hover:underline block">{att.name}</a>
                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                                      <span>{formatBytes(att.size)} • Imagem</span>
                                      {isCoverUrl(att.url) && <Badge variant="secondary">Capa</Badge>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => window.open(att.url, '_blank')}>Abrir</Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDownload(att.url, att.name)}>Baixar</Button>
                                  <Button variant={isCoverUrl(att.url) ? "default" : "secondary"} size="sm" onClick={() => setCoverFromUrl(att.url)}>
                                    {isCoverUrl(att.url) ? 'Capa definida' : 'Definir capa'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { if (window.confirm('Excluir anexo?')) { if (relationMissing) { handleAttachmentRemove(att.path, att.name); } else { remove(att.id, att.path); } } }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Excluir
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {dataset.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {filterOptions.map((f) => (
                                <Button key={f.key} size="sm" variant={filterState === f.key ? 'default' : 'outline'} onClick={() => setFilterState(f.key)}>{f.label}</Button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select value={sortByState} onValueChange={(v) => setSortByState(v as SortBy)}>
                                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="date">Data</SelectItem>
                                  <SelectItem value="name">Nome</SelectItem>
                                  <SelectItem value="size">Tamanho</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="outline" onClick={() => setSortDirState((d) => d === 'asc' ? 'desc' : 'asc')}>{sortDirState === 'asc' ? 'Asc' : 'Desc'}</Button>
                            </div>
                          </div>
                          {dataset.map((att) => (
                            <div key={att.path} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center gap-3 min-w-0">
                                {att.type.startsWith('image/') ? (
                                  <div className="relative h-8 w-8 rounded overflow-hidden border bg-muted">
                                    <button
                                      type="button"
                                      className="absolute inset-0"
                                      onClick={(e) => { e.stopPropagation(); setViewerSrc(att.url); setViewerOpen(true); }}
                                      aria-label="Visualizar imagem"
                                    />
                                    <LazyImage src={att.url} alt={att.name} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity" />
                                    <Image className="absolute top-1 right-1 h-3 w-3 text-white/80" />
                                  </div>
                                ) : (
                                  <span className="shrink-0">{attachmentIcon(att.type)}</span>
                                )}
                                <div className="min-w-0">
                                  {!relationMissing && editingName[att.id] !== undefined ? (
                                    <div className="flex items-center gap-2">
                                      <Input value={editingName[att.id]} onChange={(e) => setEditingName((m) => ({ ...m, [att.id]: e.target.value }))} className="h-7" />
                                      <Button size="sm" onClick={async () => { await rename(att.id, (editingName[att.id] || '').trim() || att.name); setEditingName((m) => { const { [att.id]:_, ...rest } = m; return rest; }); }}>Salvar</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingName((m) => { const { [att.id]:_, ...rest } = m; return rest; })}>Cancelar</Button>
                                    </div>
                                  ) : (
                                    <a href={att.url} target="_blank" rel="noreferrer" className="truncate hover:underline block">{att.name}</a>
                                  )}
                                  <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                                    <span>{formatBytes(att.size)} • {friendlyTypeLabel(att.type)}</span>
                                    <span>{formatDistanceToNow(new Date(att.created_at || new Date().toISOString()), { locale: ptBR })}</span>
                                    {isCoverUrl(att.url) && <Badge variant="secondary">Capa</Badge>}
                                  </div>
                                  {!relationMissing && editingDesc[att.id] !== undefined && (
                                    <div className="mt-1 flex items-center gap-2">
                                      <Textarea value={editingDesc[att.id]} onChange={(e) => setEditingDesc((m) => ({ ...m, [att.id]: e.target.value }))} className="min-h-[60px]" />
                                      <div className="flex flex-col gap-2">
                                        <Button size="sm" onClick={async () => { await setAttachmentDescription(att.id, (editingDesc[att.id] || '').trim()); setEditingDesc((m) => { const { [att.id]:_, ...rest } = m; return rest; }); }}>Salvar</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingDesc((m) => { const { [att.id]:_, ...rest } = m; return rest; })}>Cancelar</Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {att.type.startsWith('image/') && (
                                  <Button variant={isCoverUrl(att.url) ? "default" : "secondary"} size="sm" onClick={() => setCoverFromUrl(att.url)}>
                                    {isCoverUrl(att.url) ? 'Capa definida' : 'Definir capa'}
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" sideOffset={6} className="z-[100]">
                                    <DropdownMenuItem onSelect={() => window.open(att.url, '_blank')}>Abrir</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload(att.url, att.name)}>Baixar</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {!relationMissing && (
                                      <>
                                        <DropdownMenuItem onSelect={() => setEditingName((m) => ({ ...m, [att.id]: att.name }))}>Renomear</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setEditingDesc((m) => ({ ...m, [att.id]: att.description || '' }))}>Adicionar descrição</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    {att.type.startsWith('image/') && (
                                      <DropdownMenuItem onSelect={() => setCoverFromUrl(att.url)}>Definir como capa</DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => { if (window.confirm('Excluir anexo?')) { if (relationMissing) { handleAttachmentRemove(att.path, att.name); } else { remove(att.id, att.path); } } }} className="text-red-600">Excluir</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Descrição */}
                  <div>
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Textarea
                      value={description}
                      onChange={(e) => { const v = e.target.value; setDescription(v); }}
                      placeholder="Descrição do cartão"
                      className="min-h-[80px] resize-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => updateCard({ cardId: card.id, updates: { title: (title || '').trim() || 'Sem título', description: (description || '').trim() } })}>
                        Salvar alterações
                      </Button>
                    </div>
                  </div>

                  {/* 3. Vencimento */}
                  <div>
                    <label className="text-sm text-muted-foreground">Vencimento</label>
                    <Input type="date" value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} />
                  </div>

                  {/* Dynamic Custom Fields */}
                  {board?.customFields && board.customFields.length > 0 && (
                    <>
                      {board.customFields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => {
                          const value = custom?.[field.id];
                          return (
                            <div key={field.id}>
                              <label className="text-sm text-muted-foreground">
                                {field.name} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              {field.helpText && (
                                <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                              )}
                              {field.type === "text" && (
                                <Input
                                  placeholder={`Digite ${field.name.toLowerCase()}`}
                                  value={(value as string) || ""}
                                  onChange={(e) => { const v = e.target.value; setCustom((prev) => ({ ...(prev || {}), [field.id]: v })); saveCustomValue(field.id, v); }}
                                />
                              )}
                              {field.type === "textarea" && (
                                <Textarea
                                  placeholder={`Digite ${field.name.toLowerCase()}`}
                                  value={(value as string) || ""}
                                  onChange={(e) => { const v = e.target.value; setCustom((prev) => ({ ...(prev || {}), [field.id]: v })); saveCustomValue(field.id, v); }}
                                  className="min-h-[80px] resize-none"
                                />
                              )}
                              {field.type === "number" && (
                                <Input
                                  type="number"
                                  placeholder={`Digite ${field.name.toLowerCase()}`}
                                  value={(value as string) || ""}
                                  onChange={(e) => { const v = e.target.value; setCustom((prev) => ({ ...(prev || {}), [field.id]: v })); saveCustomValue(field.id, v); }}
                                />
                              )}
                              {field.type === "date" && (
                                <Input
                                  type="date"
                                  value={(value as string) || ""}
                                  onChange={(e) => { const v = e.target.value; setCustom((prev) => ({ ...(prev || {}), [field.id]: v })); saveCustomValue(field.id, v); }}
                                />
                              )}
                              {field.type === "checkbox" && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={Boolean(value)}
                                    onCheckedChange={(checked) => { setCustom((prev) => ({ ...(prev || {}), [field.id]: checked })); saveCustomValue(field.id, checked); }}
                                  />
                                  <span className="text-sm">{field.name}</span>
                                </div>
                              )}
                              {field.type === "select" && field.options && (
                                <Select
                                  value={(value as string) || ""}
                                  onValueChange={(v) => { setCustom((prev) => ({ ...(prev || {}), [field.id]: v })); saveCustomValue(field.id, v); }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Selecione ${field.name.toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {field.type === "multi-select" && field.options && (
                                <div className="space-y-2">
                                  {field.options.map((option) => {
                                    const selectedValues = Array.isArray(value) ? (value as string[]) : [];
                                    const isSelected = selectedValues.includes(option);
                                    return (
                                      <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            const currentValues = new Set(selectedValues);
                                            if (checked) {
                                              currentValues.add(option);
                                            } else {
                                              currentValues.delete(option);
                                            }
                                            const out = Array.from(currentValues);
                                            setCustom((prev) => ({ ...(prev || {}), [field.id]: out }));
                                            saveCustomValue(field.id, out);
                                          }}
                                        />
                                        <span className="text-sm">{option}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </>
                  )}

                  {/* 5. Tags */}
                  <div>
                    <label className="text-sm text-muted-foreground">Tags</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {labels.map((l) => (
                        <Badge
                          key={l.id}
                          className={cn("cursor-pointer", labelColorClass[l.color as LabelColor] || "")}
                          style={labelColorClass[l.color as LabelColor] ? undefined : { backgroundColor: l.color, color: '#fff' }}
                          onClick={() => removeLabel(l.id)}
                          title={`Remover tag ${l.name}`}
                        >
                          {l.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-muted-foreground">Criar nova tag:</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da tag"
                          value={newTagName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={selectedTagColor} onValueChange={(value: LabelColor) => setSelectedTagColor(value)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--label-green))]" />
                                Verde
                              </div>
                            </SelectItem>
                            <SelectItem value="yellow">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--label-yellow))]" />
                                Amarelo
                              </div>
                            </SelectItem>
                            <SelectItem value="orange">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--label-orange))]" />
                                Laranja
                              </div>
                            </SelectItem>
                            <SelectItem value="red">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--label-red))]" />
                                Vermelho
                              </div>
                            </SelectItem>
                            <SelectItem value="purple">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--label-purple))]" />
                                Roxo
                              </div>
                            </SelectItem>
                            <SelectItem value="blue">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--label-blue))]" />
                                Azul
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {/* Color picker and HEX input for custom colors */}
                        <input
                          type="color"
                          value={isHexColor(selectedTagColor) ? selectedTagColor : '#000000'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedTagColor(e.target.value)}
                          className="w-9 h-9 p-0 border rounded"
                          title="Escolher cor"
                        />
                        <Input
                          placeholder="#HEX"
                          value={isHexColor(selectedTagColor) ? selectedTagColor : ''}
                          onChange={(e) => setSelectedTagColor(e.target.value)}
                          className="w-[100px]"
                        />
                        <Button size="sm" onClick={addLabel} disabled={!newTagName.trim()}>
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            /* Clean Trello-like Interface for Normal Boards */
            <>
              {/* Left Column - Clean Form */}
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
                    <DropdownMenu open={addMenuOpen} onOpenChange={setAddMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => setAddMenuOpen(true)}>
                          + Adicionar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" sideOffset={6} className="min-w-[260px] z-[100]">
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <span className="text-sm font-semibold">Adicionar ao cartão</span>
                          <button
                            type="button"
                            onClick={() => setAddMenuOpen(false)}
                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-6 w-6 inline-flex items-center justify-center"
                            aria-label="Fechar"
                          >
                            ×
                          </button>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setShowTags(true)} className="gap-3 py-2">
                          <Tag className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Etiquetas</div>
                            <div className="text-xs text-muted-foreground">Organize, categorize e priorize</div>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setShowDates(true)} className="gap-3 py-2">
                          <CalendarDays className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Datas</div>
                            <div className="text-xs text-muted-foreground">Início, entrega e lembretes</div>
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onSelect={() => setShowMembers(true)} className="gap-3 py-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Membros</div>
                            <div className="text-xs text-muted-foreground">Atribuir membros ao cartão</div>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); triggerAttachmentUpload(); }} className="gap-3 py-2">
                          <Paperclip className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Anexo</div>
                            <div className="text-xs text-muted-foreground">Links, arquivos e imagens</div>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant={(coverImages.length > 0 || coverColor) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoverDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Capa
                      {(coverImages.length > 0 || coverColor) && (
                        <Badge variant="secondary" className="ml-1">✓</Badge>
                      )}
                    </Button>
                    <Button
                      variant={showTags ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTags(!showTags)}
                      className="flex items-center gap-2"
                    >
                      <Tag className="h-4 w-4" />
                      Tags
                      {labels.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {labels.length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant={showDates ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowDates(!showDates)}
                      className="flex items-center gap-2"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Datas
                      {dueDate && (
                        <Badge variant="secondary" className="ml-1">
                          ✓
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant={showMembers ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowMembers(!showMembers)}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Membros
                      {members.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {members.length}
                        </Badge>
                      )}
                    </Button>

                  </div>

                  {/* Title - Always Visible */}
                  <div>
                    <label className="text-sm text-muted-foreground">Título *</label>
                    <Input
                      value={title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; setTitle(v); }}
                      placeholder="Título do cartão"
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* Description - Always Visible */}
                  <div>
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Textarea
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { const v = e.target.value; setDescription(v); }}
                      placeholder="Adicionar uma descrição mais detalhada..."
                      className="min-h-[120px] resize-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => updateCard({ cardId: card.id, updates: { title: (title || '').trim() || 'Sem título', description: (description || '').trim() } })}>
                        Salvar alterações
                      </Button>
                    </div>
                  </div>

                  {/* Imagens (miniaturas com overlay) */}
                      {galleryImages.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-3 animate-fade-in">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Imagens
                          </h3>
                          <div className="space-y-2">
                        {galleryImages.map((att) => (
                          <div key={att.path} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative h-8 w-8 rounded overflow-hidden border bg-muted shrink-0">
                                <button
                                  type="button"
                                  className="absolute inset-0"
                                  onClick={(e) => { e.stopPropagation(); setViewerSrc(att.url); setViewerOpen(true); }}
                                  aria-label="Visualizar imagem"
                                />
                                <LazyImage
                                  src={att.url}
                                  alt={att.name}
                                  className="h-full w-full object-cover"
                                  placeholderClassName="bg-muted"
                                />
                              </div>
                              <div className="min-w-0">
                                <a href={att.url} target="_blank" rel="noreferrer" className="truncate hover:underline block">{att.name}</a>
                                <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                                  <span>Imagem</span>
                                  {isCoverUrl(att.url) && <Badge variant="secondary">Capa</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => window.open(att.url, '_blank')}>Abrir</Button>
                              <Button variant="outline" size="sm" onClick={() => handleDownload(att.url, att.name)}>Baixar</Button>
                              <Button variant={isCoverUrl(att.url) ? "default" : "secondary"} size="sm" onClick={() => setCoverFromUrl(att.url)}>
                                {isCoverUrl(att.url) ? 'Capa definida' : 'Definir capa'}
                              </Button>
                              {(!String(att.id || '').startsWith('cover_')) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { if (window.confirm('Excluir anexo?')) { if (relationMissing) { handleAttachmentRemove(att.path, att.name); } else { remove(att.id, att.path); } } }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Excluir
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                          </div>
                        </div>
                      )}

                  {/* Arquivos */}
                  {(attachments.length > 0 || showAttachments) && (
                  <div className="border rounded-lg p-4 space-y-4 animate-fade-in">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Arquivos
                    </h3>
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentUpload}
                        className="hidden"
                        id="file-upload-clean"
                      />
                      <div
                        className="flex items-center justify-center w-full h-12 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        onClick={() => setAttachmentsDialogOpen(true)}
                      >
                        <div className="text-center">
                          <div className="text-muted-foreground text-sm">Clique para anexar arquivos (ou links)</div>
                        </div>
                      </div>
                    </div>
                    {isUploadingAttachment && (
                      <div className="text-xs text-muted-foreground">Enviando...</div>
                    )}
                    {fileAttachments.length > 0 && (
                      <div className="space-y-2">
                        {fileAttachments.map((att) => (
                          <div key={att.path} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="shrink-0">{attachmentIcon(att.type)}</span>
                              <a href={att.url} target="_blank" rel="noreferrer" className="truncate hover:underline">{att.name}</a>
                              <span className="text-xs text-muted-foreground truncate">{formatBytes(att.size || 0)} • {friendlyTypeLabel(att.type)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => window.open(att.url, '_blank')}>
                                Abrir
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDownload(att.url, att.name)}>
                                Baixar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { if (window.confirm('Excluir anexo?')) { if (relationMissing) { handleAttachmentRemove(att.path, att.name); } else { remove(att.id, att.path); } } }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Expandable Sections */}
                  

                  {/* Cover color selection moved to dialog */}

                  {/* Tags Section */}
                  {showTags && (
                    <div className="border rounded-lg p-4 space-y-4 animate-fade-in">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {labels.map((l) => (
                          <Badge
                            key={l.id}
                            className={cn("cursor-pointer", labelColorClass[l.color as LabelColor] || "")}
                            style={labelColorClass[l.color as LabelColor] ? undefined : { backgroundColor: l.color, color: '#fff' }}
                            onClick={() => removeLabel(l.id)}
                            title={`Remover tag ${l.name}`}
                          >
                            {l.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da tag"
                          value={newTagName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={selectedTagColor} onValueChange={(value: LabelColor) => setSelectedTagColor(value)}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Verde</SelectItem>
                            <SelectItem value="yellow">Amarelo</SelectItem>
                            <SelectItem value="orange">Laranja</SelectItem>
                            <SelectItem value="red">Vermelho</SelectItem>
                            <SelectItem value="purple">Roxo</SelectItem>
                            <SelectItem value="blue">Azul</SelectItem>
                          </SelectContent>
                        </Select>
                        {/* Color picker and HEX input for custom colors */}
                        <input
                          type="color"
                          value={isHexColor(selectedTagColor) ? selectedTagColor : '#000000'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedTagColor(e.target.value)}
                          className="w-9 h-9 p-0 border rounded"
                          title="Escolher cor"
                        />
                        <Input
                          placeholder="#HEX"
                          value={isHexColor(selectedTagColor) ? selectedTagColor : ''}
                          onChange={(e) => setSelectedTagColor(e.target.value)}
                          className="w-[100px]"
                        />
                        <Button size="sm" onClick={addLabel} disabled={!newTagName.trim()}>
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Dates Section */}
                  {showDates && (
                    <div className="border rounded-lg p-4 space-y-4 animate-fade-in">
                      <h3 className="font-semibold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Data de Vencimento
                      </h3>
                    <Input type="date" value={dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)} />
                    </div>
                  )}

                  {/* Members Section */}
                  {showMembers && (
                    <div className="border rounded-lg p-4 space-y-4 animate-fade-in">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Membros do Card
                      </h3>
                      <MemberSelect
                        selectedMembers={members}
                        onMembersChange={setMembers}
                        cardId={card.id}
                        boardId={boardId}
                      />
                    </div>
                  )}


                </div>
              </ScrollArea>
            </>
          )}

          {/* Right Column - Comments (Same for Both Interfaces) */}
          <div className="flex flex-col min-h-0">
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Atividade ({comments.length})
              </h3>
            </div>

            {/* Comments Display */}
            <ScrollArea className="flex-1 pr-4" ref={commentsScrollRef}>
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
                ) : (
                  comments
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 mt-1">
                        {comment.type === 'activity' ? (
                          (() => {
                            const { type } = parseActivity(comment.content);
                            return getActivityIcon(type);
                          })()
                        ) : (
                          <Avatar className="size-8 border bg-muted">
                            {comment.avatarUrl && (
                              <AvatarImage src={comment.avatarUrl} alt={comment.author} />
                            )}
                            <AvatarFallback className="text-xs">
                              {comment.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{comment.author}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatCommentTime(comment.timestamp)}
                          </span>
                        </div>
                        <div className={cn(
                          "text-sm break-words",
                          comment.type === "activity" 
                            ? "text-muted-foreground" 
                            : "p-3 rounded-lg bg-muted text-foreground"
                        )}>
                          {comment.type === 'activity' ? (
                            (() => {
                              const { description } = parseActivity(comment.content);
                              return description;
                            })()
                          ) : (
                            comment.content
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <Avatar className="size-8 border bg-muted shrink-0">
                  <AvatarFallback className="text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Escrever um comentário..."
                    value={newComment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    onFocus={() => setCommentFocused(true)}
                    onBlur={() => setCommentFocused(false)}
                    className="min-h-[80px] resize-none text-sm"
                  />
                  {(commentFocused || newComment.trim().length > 0) && (
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isAddingComment}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-3 w-3" />
                        {isAddingComment ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={viewerOpen}
        src={viewerSrc}
        onOpenChange={(open) => { setViewerOpen(open); if (!open) setViewerSrc(null); }}
      />
      <AttachmentDialog
        open={attachmentsDialogOpen}
        onOpenChange={setAttachmentsDialogOpen}
        boardId={boardId}
        cardId={card.id}
      />
      {/* Cover Color Dialog */}
      <Dialog open={coverDialogOpen} onOpenChange={setCoverDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Capa do Card
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Escolha uma cor para a capa do cartão.</p>
            <div className="grid grid-cols-6 gap-2">
              {(["green","yellow","orange","red","purple","blue"] as LabelColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn("h-10 rounded-md border", labelBgClass[c], coverColor === c && "ring-2 ring-offset-2 ring-primary")}
                  onClick={() => { 
                    setCoverColor(c);
                    updateCard({
                      cardId: card.id,
                      updates: { cover_color: c }
                    });
                    setCoverDialogOpen(false); 
                  }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" type="button" onClick={() => { clearCover(); setCoverDialogOpen(false); }}>Remover capa</Button>
              <Button size="sm" type="button" onClick={() => setCoverDialogOpen(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
