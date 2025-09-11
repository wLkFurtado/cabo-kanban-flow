import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MessageSquare, Clock, User, Send } from "lucide-react";

import { Card as TCard, Label as TLabel, LabelColor, Member as TMember, Comment } from "@/state/kanbanTypes";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBoardsStore } from "@/state/boardsStore";
import { useToast } from "@/hooks/use-toast";

const labelColorClass: Record<LabelColor, string> = {
  green: "bg-[hsl(var(--label-green))] text-white",
  yellow: "bg-[hsl(var(--label-yellow))] text-black",
  orange: "bg-[hsl(var(--label-orange))] text-white", 
  red: "bg-[hsl(var(--label-red))] text-white",
  purple: "bg-[hsl(var(--label-purple))] text-white",
  blue: "bg-[hsl(var(--label-blue))] text-white",
};

const labelNames: Record<LabelColor, string> = {
  green: "Verde",
  yellow: "Amarelo", 
  orange: "Laranja",
  red: "Vermelho",
  purple: "Roxo",
  blue: "Azul",
};

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  card: TCard;
}

export function CardModal({ open, onOpenChange, boardId, card }: CardModalProps) {
  const updateCard = useBoardsStore((s) => s.updateCard);
  const deleteCard = useBoardsStore((s) => s.deleteCard);
  const addComment = useBoardsStore((s) => s.addComment);
  const board = useBoardsStore((s) => s.boards[boardId]);
  const { toast } = useToast();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState<string>(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
  const [labels, setLabels] = useState<TLabel[]>(card.labels || []);
  const [members, setMembers] = useState<TMember[]>(card.members || []);
  const [custom, setCustom] = useState<Record<string, unknown>>((card as any).custom || {});
  const [coverImages, setCoverImages] = useState<string[]>(card.coverImages || []);
  const [newComment, setNewComment] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description || "");
      setDueDate(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
      setLabels(card.labels || []);
      setMembers(card.members || []);
      setCustom((card as any).custom || {});
      setCoverImages(card.coverImages || []);
    }
  }, [open, card]);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const handleSave = () => {
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

    updateCard(boardId, card.id, {
      title: title.trim() || "Sem título",
      description: description.trim(),
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : undefined,
      labels,
      members,
      custom,
      coverImages: coverImages.length > 0 ? coverImages : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteCard(boardId, card.listId, card.id);
    onOpenChange(false);
  };

  const addLabel = (color: LabelColor) => {
    // Verifica se já existe uma label com essa cor
    if (labels.some(l => l.color === color)) return;
    
    const label: TLabel = { 
      id: `l_${Math.random().toString(36).slice(2, 8)}`, 
      name: labelNames[color], 
      color 
    };
    setLabels((prev) => [...prev, label]);
  };

  const removeLabel = (id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    const member: TMember = { id: `m_${Math.random().toString(36).slice(2, 8)}`, name };
    setMembers((prev) => [...prev, member]);
    setNewMemberName("");
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddComment = () => {
    const content = newComment.trim();
    if (!content) return;
    
    // For now, using a default author - this would come from auth in a real app
    addComment(boardId, card.id, "Usuário", content, "comment");
    setNewComment("");
    
    // Auto-scroll to bottom of comments
    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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

  const formatCommentTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return "agora";
    }
  };

  const comments = card.comments || [];
  const commentsCount = comments.filter(c => c.type === "comment").length;

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
          {/* Left Column - Form */}
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Cover Images */}
              <div>
                <label className="text-sm text-muted-foreground">Imagens do Card</label>
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
                              className="w-full h-full object-cover"
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

              {/* 4. Labels */}
              <div>
                <label className="text-sm text-muted-foreground">Labels</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {labels.map((l) => (
                    <Badge
                      key={l.id}
                      className={cn("cursor-pointer", labelColorClass[l.color])}
                      onClick={() => removeLabel(l.id)}
                      title={`Remover label ${l.name}`}
                    >
                      {l.name}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Clique em uma cor para adicionar:</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(labelNames) as LabelColor[]).map((color) => {
                      const hasLabel = labels.some(l => l.color === color);
                      return (
                        <button
                          key={color}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-opacity",
                            labelColorClass[color],
                            hasLabel && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => addLabel(color)}
                          disabled={hasLabel}
                          title={hasLabel ? `Label ${labelNames[color]} já adicionada` : `Adicionar label ${labelNames[color]}`}
                        >
                          {labelNames[color]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. Membros */}
              <div>
                <label className="text-sm text-muted-foreground">Membros</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => removeMember(m.id)}
                      className="flex items-center gap-2 border rounded-md px-2 py-1 text-xs"
                    >
                      <Avatar className="size-6 border bg-muted">
                        <AvatarFallback className="text-[10px]">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Nome do membro"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="max-w-[220px]"
                  />
                  <Button size="sm" onClick={addMember}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Right Column - Comments */}
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
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                      <Avatar className="size-8 border bg-muted shrink-0">
                        <AvatarFallback className="text-xs">
                          {comment.type === "activity" ? "📝" : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{comment.author}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatCommentTime(comment.timestamp)}
                          </span>
                        </div>
                        <div className={cn(
                          "p-3 rounded-lg text-sm break-words",
                          comment.type === "activity" 
                            ? "bg-muted/50 text-muted-foreground italic border-l-2 border-primary/20" 
                            : "bg-muted text-foreground"
                        )}>
                          {comment.content}
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
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[80px] resize-none text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-3 w-3" />
                      Comentar
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
          <Button variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}