import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import { MessageSquare, Clock, User, Send, Calendar, Tag, Paperclip, ArrowRight, Plus, Image, CalendarDays, Users, Palette, Check } from "lucide-react";

import { Card as TCard, Label as TLabel, LabelColor, Comment, Member } from "../../state/kanbanTypes";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBoardsStore } from "../../state/boards/store";
import { useBoardDetails } from "../../hooks/useBoards";
import { useComments } from "../../hooks/useComments";
import { useActivities } from "../../hooks/useActivities";
import { supabase } from "../../integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/use-toast";
import { MemberSelect } from "./MemberSelect";
import { useAuth } from "../../hooks/useAuth";
import { ImageViewerDialog } from "./ImageViewerDialog";
import { postWebhook } from "../../lib/webhook";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
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

  const isHexColor = (val: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);

  // State for expandable sections (clean interface only)
  const [showImages, setShowImages] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
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
    // Sinaliza início para depuração visual
    toast({ title: 'Iniciando exclusão...', description: 'Processando remoção do card.' });
    // Executar exclusão diretamente via Supabase para garantir ação imediata
    try {
      setIsDeleting(true);
      console.log('[CardModal] Iniciando exclusão do card', card.id);
      const { data, error } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        // Diagnóstico adicional para entender o bloqueio (RLS ou inconsistência)
        try {
          // Tentar obter o board_id da lista do card
          const { data: listRow } = await supabase
            .from('board_lists')
            .select('id, board_id')
            .eq('id', card.list_id)
            .maybeSingle();

          // Tentar verificar se o usuário é membro do board
          let isMember = false;
          if (listRow?.board_id && user?.id) {
            const { data: membership } = await supabase
              .from('board_members')
              .select('user_id')
              .eq('board_id', listRow.board_id)
              .eq('user_id', user.id);
            isMember = !!(membership && membership.length > 0);
          }

          console.warn('[CardModal] Exclusão não afetou nenhuma linha. Possível RLS ou card inexistente.', {
            cardId: card.id,
            listId: card.list_id,
            boardId: listRow?.board_id,
            isMember,
          });
        } catch (diagErr) {
          console.warn('[CardModal] Falha na coleta de diagnóstico pós-exclusão:', diagErr);
        }

        toast({
          title: 'Não foi possível excluir',
          description: 'Verifique seu acesso ao board ou tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      // Invalida cache dos cards do board para refletir a remoção
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });

      toast({ title: 'Card excluído', description: 'O card foi excluído com sucesso.' });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Erro ao excluir card', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
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
    setCoverImages((prev) => prev.filter((_, i) => i !== index));
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
  const supabaseContents = new Set(supabaseActivities.map((a) => a.content));
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
  }, [open, boardId]);

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

  const mergedActivities = [
    ...(boardCreatedActivity ? [boardCreatedActivity] : []),
    ...supabaseActivities,
    ...localActivities.filter((c) => !supabaseContents.has(c.content)),
  ];

  const comments = [
    ...mergedActivities,
    ...convertedSupabaseComments,
  ];
  const commentsCount = comments.filter((c) => c.type === "comment").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
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
                  {/* Cover Images */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">Imagens do Card</label>
                      <Button variant="outline" size="sm" type="button" onClick={() => setCoverDialogOpen(true)} className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Capa
                      </Button>
                    </div>
                    <div className="mt-2 space-y-4">
                      {/* Upload Button */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        >
                          <div className="text-center">
                            <div className="text-muted-foreground text-sm">Clique para adicionar imagens</div>
                            <div className="text-muted-foreground text-xs mt-1">Suporte para múltiplas imagens</div>
                          </div>
                        </label>
                      </div>
                      
                      {/* Image Gallery */}
                      {coverImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {coverImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                                <img
                                  src={image}
                                  alt={`Imagem ${index + 1}`}
                                  className="w-full h-full object-contain bg-muted"
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                ×
                              </Button>
                              {index === 0 && (
                                <div className="absolute bottom-2 left-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Capa Principal
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Cover color selection moved to dialog */}
                    </div>
                  </div>

                  {/* 1. Título */}
                  <div>
                    <label className="text-sm text-muted-foreground">Título *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título do cartão"
                    />
                  </div>

                  {/* 2. Descrição */}
                  <div>
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descrição do cartão"
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 3. Vencimento */}
                  <div>
                    <label className="text-sm text-muted-foreground">Vencimento</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
                                  onChange={(e) => setCustom((prev) => ({ ...(prev || {}), [field.id]: e.target.value }))}
                                />
                              )}
                              {field.type === "textarea" && (
                                <Textarea
                                  placeholder={`Digite ${field.name.toLowerCase()}`}
                                  value={(value as string) || ""}
                                  onChange={(e) => setCustom((prev) => ({ ...(prev || {}), [field.id]: e.target.value }))}
                                  className="min-h-[80px] resize-none"
                                />
                              )}
                              {field.type === "number" && (
                                <Input
                                  type="number"
                                  placeholder={`Digite ${field.name.toLowerCase()}`}
                                  value={(value as string) || ""}
                                  onChange={(e) => setCustom((prev) => ({ ...(prev || {}), [field.id]: e.target.value }))}
                                />
                              )}
                              {field.type === "date" && (
                                <Input
                                  type="date"
                                  value={(value as string) || ""}
                                  onChange={(e) => setCustom((prev) => ({ ...(prev || {}), [field.id]: e.target.value }))}
                                />
                              )}
                              {field.type === "checkbox" && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={Boolean(value)}
                                    onCheckedChange={(checked) => setCustom((prev) => ({ ...(prev || {}), [field.id]: checked }))}
                                  />
                                  <span className="text-sm">{field.name}</span>
                                </div>
                              )}
                              {field.type === "select" && field.options && (
                                <Select
                                  value={(value as string) || ""}
                                  onValueChange={(v) => setCustom((prev) => ({ ...(prev || {}), [field.id]: v }))}
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
                                            setCustom((prev) => ({ ...(prev || {}), [field.id]: Array.from(currentValues) }));
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
                    <Button
                      variant={showImages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowImages(!showImages)}
                      className="flex items-center gap-2"
                    >
                      <Image className="h-4 w-4" />
                      Imagens
                      {coverImages.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {coverImages.length}
                        </Badge>
                      )}
                    </Button>
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                      placeholder="Título do cartão"
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* Description - Always Visible */}
                  <div>
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Textarea
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      placeholder="Adicionar uma descrição mais detalhada..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Expandable Sections */}
                  
                  {/* Images Section */}
                  {showImages && (
                    <div className="border rounded-lg p-4 space-y-4 animate-fade-in">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Imagens do Card
                      </h3>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload-clean"
                        />
                        <label
                          htmlFor="image-upload-clean"
                          className="flex items-center justify-center w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        >
                          <div className="text-center">
                            <div className="text-muted-foreground text-sm">Clique para adicionar imagens</div>
                          </div>
                        </label>
                      </div>
                      
                      {coverImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {coverImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                                <img
                                  src={image}
                                  alt={`Imagem ${index + 1}`}
                                  className="w-full h-full object-contain bg-muted cursor-zoom-in"
                                  onClick={() => {
                                    setViewerSrc(image);
                                    setViewerOpen(true);
                                  }}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={() => removeImage(index)}
                              >
                                ×
                              </Button>
                              {index === 0 && (
                                <div className="absolute bottom-1 left-1">
                                  <Badge variant="secondary" className="text-xs px-1">
                                    Capa
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modal de visualização de imagem */}
                  <ImageViewerDialog
                    open={viewerOpen}
                    src={viewerSrc}
                    onOpenChange={(o) => {
                      setViewerOpen(o);
                      if (!o) setViewerSrc(null);
                    }}
                  />

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
                    className="min-h-[80px] resize-none text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isAddingComment}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-3 w-3" />
                      {isAddingComment ? "Comentando..." : "Comentar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir card</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza de que deseja excluir este card? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
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