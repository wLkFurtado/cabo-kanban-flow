import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { Card as TCard, Label as TLabel, LabelColor, Member as TMember } from "@/state/kanbanTypes";
import { parseISO, format } from "date-fns";
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
  const board = useBoardsStore((s) => s.boards[boardId]);
  const { toast } = useToast();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState<string>(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
  const [labels, setLabels] = useState<TLabel[]>(card.labels || []);
  const [members, setMembers] = useState<TMember[]>(card.members || []);
  const [custom, setCustom] = useState<Record<string, unknown>>((card as any).custom || {});

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description || "");
      setDueDate(card.dueDate ? format(parseISO(card.dueDate), "yyyy-MM-dd") : "");
      setLabels(card.labels || []);
      setMembers(card.members || []);
      setCustom((card as any).custom || {});
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar cartão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Vencimento</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

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

          <div>
            <label className="text-sm text-muted-foreground">Secretaria solicitante</label>
            <Input
              placeholder="Informe a secretaria solicitante"
              value={(custom as any).secretariaSolicitante || ""}
              onChange={(e) => setCustom((prev) => ({ ...(prev || {}), secretariaSolicitante: e.target.value }))}
            />
          </div>

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
        </div>

          {/* Fixed Communication Fields */}
          <div className="space-y-3 mt-2">
            <h4 className="text-sm font-medium">Campos de Comunicação</h4>
            
            {/* Título/Nome do Evento */}
            <div>
              <label className="text-sm text-muted-foreground">Título/Nome do Evento *</label>
              <Input
                value={(custom as any).tituloEvento || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), tituloEvento: e.target.value }))}
                placeholder="Nome do evento ou campanha"
              />
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

            {/* Descrição Breve */}
            <div>
              <label className="text-sm text-muted-foreground">Descrição Breve *</label>
              <Textarea
                value={(custom as any).descricaoBreve || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), descricaoBreve: e.target.value }))}
                placeholder="Descrição resumida do conteúdo"
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Data do Evento */}
            <div>
              <label className="text-sm text-muted-foreground">Data do Evento</label>
              <Input
                type="date"
                value={(custom as any).dataEvento || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), dataEvento: e.target.value }))}
              />
            </div>

            {/* Local */}
            <div>
              <label className="text-sm text-muted-foreground">Local</label>
              <Input
                value={(custom as any).local || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), local: e.target.value }))}
                placeholder="Local do evento"
              />
            </div>

            {/* Classificação */}
            <div>
              <label className="text-sm text-muted-foreground">Classificação</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={(custom as any).classificacao || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), classificacao: e.target.value }))}
              >
                <option value="">Selecione...</option>
                <option value="Livre">Livre</option>
                <option value="10 anos">10 anos</option>
                <option value="12 anos">12 anos</option>
                <option value="14 anos">14 anos</option>
                <option value="16 anos">16 anos</option>
                <option value="18 anos">18 anos</option>
              </select>
            </div>

            {/* Chamada para Ação */}
            <div>
              <label className="text-sm text-muted-foreground">Chamada para Ação</label>
              <Input
                value={(custom as any).chamadaAcao || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), chamadaAcao: e.target.value }))}
                placeholder="Ex: Inscreva-se já, Participe, etc."
              />
            </div>

            {/* Dividir em Cards para Redes Sociais */}
            <div>
              <label className="text-sm text-muted-foreground">Dividir em Cards para Redes Sociais?</label>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  checked={!!(custom as any).dividirCards}
                  onCheckedChange={(v) => setCustom((prev) => ({ ...(prev || {}), dividirCards: !!v }))}
                />
                <span className="text-sm">Sim, dividir em múltiplos cards</span>
              </div>
            </div>

            {/* Número de Cards (conditional) */}
            {(custom as any).dividirCards && (
              <div>
                <label className="text-sm text-muted-foreground">Número de Cards</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={(custom as any).numeroCards || ""}
                  onChange={(e) => setCustom((prev) => ({ ...(prev || {}), numeroCards: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Quantos cards serão criados?"
                />
              </div>
            )}

            {/* Observações Especiais */}
            <div>
              <label className="text-sm text-muted-foreground">Observações Especiais</label>
              <Textarea
                value={(custom as any).observacoes || ""}
                onChange={(e) => setCustom((prev) => ({ ...(prev || {}), observacoes: e.target.value }))}
                placeholder="Observações ou instruções especiais"
                className="min-h-[60px] resize-none"
              />
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
