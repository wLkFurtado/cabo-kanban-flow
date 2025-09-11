import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Clock, User, Send } from "lucide-react";

import { Card as TCard, Label as TLabel, LabelColor, Member as TMember, Comment } from "@/state/kanbanTypes";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBoardsStore } from "@/state/boardsStore";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [coverImage, setCoverImage] = useState(card.coverImage || "");
  const [newComment, setNewComment] = useState("");
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description || "");
      setDueDate(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
      setLabels(card.labels || []);
      setMembers(card.members || []);
      setCustom((card as any).custom || {});
      setCoverImage(card.coverImage || "");
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
    // Required fields validation for fixed communication fields
    const requiredFields = ['tituloEvento', 'assuntoPrincipal', 'descricaoBreve'];
    const requiredMissing = requiredFields.some(field => {
      const value = (custom as any)[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });
    
    if (requiredMissing) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    // Use communication fields as primary title and description
    const cardTitle = ((custom as any).tituloEvento || "").trim() || "Sem título";
    const cardDescription = ((custom as any).descricaoBreve || "").trim();

    updateCard(boardId, card.id, {
      title: cardTitle,
      description: cardDescription,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : undefined,
      labels,
      members,
      custom,
      coverImage: coverImage.trim() || undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteCard(boardId, card.listId, card.id);
    onOpenChange(false);
  };

  const [newMemberName, setNewMemberName] = useState("");

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
          {/* Cover Image */}
          <div>
            <label className="text-sm text-muted-foreground">Capa do Card</label>
            <div className="mt-2 space-y-2">
              <Input
                placeholder="URL da imagem de capa"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
              {coverImage && (
                <div className="relative">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                    <img
                      src={coverImage}
                      alt="Preview da capa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLDivElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-muted text-muted-foreground text-sm">
                      Erro ao carregar imagem
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => setCoverImage("")}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 1. Título/Nome do Evento */}
          <div>
            <label className="text-sm text-muted-foreground">Título/Nome do Evento *</label>
            <Input
              value={(custom as any).tituloEvento || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), tituloEvento: e.target.value }))}
              placeholder="Nome do evento ou campanha"
            />
          </div>

          {/* 2. Descrição Breve */}
          <div>
            <label className="text-sm text-muted-foreground">Descrição Breve *</label>
            <Textarea
              value={(custom as any).descricaoBreve || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), descricaoBreve: e.target.value }))}
              placeholder="Descrição resumida do conteúdo"
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* 3. Vencimento */}
          <div>
            <label className="text-sm text-muted-foreground">Vencimento</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

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

          {/* 6. Secretaria solicitante */}
          <div>
            <label className="text-sm text-muted-foreground">Secretaria solicitante</label>
            <Input
              placeholder="Informe a secretaria solicitante"
              value={(custom as any).secretariaSolicitante || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), secretariaSolicitante: e.target.value }))}
            />
          </div>

          {/* 7. Tipos de demanda */}
          <div>
            <label className="text-sm text-muted-foreground">Tipos de demanda</label>
            <div className="mt-2 flex flex-col gap-2">
              {[
                "Criação de demanda gráfica",
                "Post para redes sociais",
                "Nota ou matéria para imprensa/site",
                "Apoio de mídia (rádio, TV, outdoor etc.)",
              ].map((opt) => {
                const list = Array.isArray((custom as any).tiposDemanda) ? ((custom as any).tiposDemanda as string[]) : [];
                const checked = list.includes(opt);
                return (
                  <label key={opt} className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const curr = new Set(list);
                        if (v) curr.add(opt); else curr.delete(opt);
                        setCustom((prev) => ({ ...(prev || {}), tiposDemanda: Array.from(curr) }));
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Assunto Principal */}
          <div>
            <label className="text-sm text-muted-foreground">Assunto Principal *</label>
            <Input
              value={(custom as any).assuntoPrincipal || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), assuntoPrincipal: e.target.value }))}
              placeholder="Assunto ou tema principal"
            />
          </div>

          {/* 8. Local do evento */}
          <div>
            <label className="text-sm text-muted-foreground">Local do evento</label>
            <Input
              value={(custom as any).local || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), local: e.target.value }))}
              placeholder="Local do evento"
            />
          </div>

          {/* 9. Data do evento */}
          <div>
            <label className="text-sm text-muted-foreground">Data do evento</label>
            <Input
              type="date"
              value={(custom as any).dataEvento || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), dataEvento: e.target.value }))}
            />
          </div>

          {/* 10. Público Alvo */}
          <div>
            <label className="text-sm text-muted-foreground">Público Alvo</label>
            <Input
              value={(custom as any).publicoAlvo || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), publicoAlvo: e.target.value }))}
              placeholder="Ex: Crianças, Jovens, Adultos, Idosos, etc."
            />
          </div>

          {/* Formato de Mídia */}
          <div>
            <label className="text-sm text-muted-foreground">Formato de Mídia</label>
            <RadioGroup
              value={(custom as any).formatoMidia || ""}
              onValueChange={(value) => setCustom((prev) => ({ ...(prev || {}), formatoMidia: value }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="digital" id="digital" />
                <Label htmlFor="digital">Digital</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="impresso" id="impresso" />
                <Label htmlFor="impresso">Impresso</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="digital-impresso" id="digital-impresso" />
                <Label htmlFor="digital-impresso">Digital e Impresso</Label>
              </div>
            </RadioGroup>

            {/* Digital Options */}
            {((custom as any).formatoMidia === "digital" || (custom as any).formatoMidia === "digital-impresso") && (
              <div className="mt-3 pl-4 border-l-2 border-muted">
                <label className="text-sm text-muted-foreground">Opções Digitais</label>
                <RadioGroup
                  value={(custom as any).opcaoDigital || ""}
                  onValueChange={(value) => setCustom((prev) => ({ ...(prev || {}), opcaoDigital: value }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feed" id="feed" />
                    <Label htmlFor="feed">Feed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stories" id="stories" />
                    <Label htmlFor="stories">Stories</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="carrossel" id="carrossel" />
                    <Label htmlFor="carrossel">Carrossel</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="banner-site" id="banner-site" />
                    <Label htmlFor="banner-site">Banner Site</Label>
                  </div>
                </RadioGroup>

                {/* Banner Site Size Options */}
                {(custom as any).opcaoDigital === "banner-site" && (
                  <div className="mt-3 pl-4 border-l-2 border-muted">
                    <label className="text-sm text-muted-foreground">Tamanho do Banner</label>
                    <RadioGroup
                      value={(custom as any).tamanhoBanner || ""}
                      onValueChange={(value) => setCustom((prev) => ({ ...(prev || {}), tamanhoBanner: value }))}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1200x120" id="size-1200x120" />
                        <Label htmlFor="size-1200x120">1200x120</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1200x700" id="size-1200x700" />
                        <Label htmlFor="size-1200x700">1200x700</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="size-custom" />
                        <Label htmlFor="size-custom">Personalizado</Label>
                      </div>
                    </RadioGroup>

                    {/* Custom Size Input */}
                    {(custom as any).tamanhoBanner === "custom" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Ex: 800x600"
                          value={(custom as any).tamanhoCustom || ""}
                          onChange={(e) => setCustom((prev) => ({ ...(prev || {}), tamanhoCustom: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Impresso Options */}
            {((custom as any).formatoMidia === "impresso" || (custom as any).formatoMidia === "digital-impresso") && (
              <div className="mt-3 pl-4 border-l-2 border-muted">
                <label className="text-sm text-muted-foreground">Tamanho do Material Impresso</label>
                <Input
                  placeholder="Ex: A4, 10x15cm, etc."
                  value={(custom as any).tamanhoImpresso || ""}
                  onChange={(e) => setCustom((prev) => ({ ...(prev || {}), tamanhoImpresso: e.target.value }))}
                  className="mt-2"
                />
              </div>
            )}
          </div>
            </div>
          </ScrollArea>

          {/* Right Column - Comments & Activity */}
          <div className="flex flex-col border-l border-border pl-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-medium">Atividade</h3>
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1 max-h-[50vh] mb-4" ref={commentsScrollRef}>
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum comentário ainda</p>
                    <p className="text-xs">Seja o primeiro a comentar</p>
                  </div>
                ) : (
                  comments
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "flex gap-3 p-3 rounded-lg",
                          comment.type === "activity" 
                            ? "bg-muted/50 border-l-2 border-l-primary/30" 
                            : "bg-background border"
                        )}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs">
                            {comment.type === "activity" ? (
                              <Clock className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCommentTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Adicione um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Pressione Enter para enviar
                </span>
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

        <DialogFooter className="mt-4">
          <Button variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
