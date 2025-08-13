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
    // Required fields validation
    const requiredMissing = (board?.customFields || [])
      .filter((f) => f.required)
      .some((f) => {
        const v = (custom as any)[f.id];
        if (f.type === "checkbox") return v === undefined || v === null;
        if (f.type === "multi-select") return !Array.isArray(v) || (v as any[]).length === 0;
        return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
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
            <label className="text-sm text-muted-foreground">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Descrição</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

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

        {/* Custom fields */}
        {board?.customFields?.length ? (
          <div className="space-y-3 mt-2">
            <h4 className="text-sm font-medium">Campos personalizados</h4>
            {(board.customFields || []).sort((a,b)=>a.order-b.order).map((f) => {
              const val = (custom as any)[f.id];
              const setVal = (v: unknown) => setCustom((prev) => ({ ...(prev || {}), [f.id]: v }));
              return (
                <div key={f.id} className="space-y-1">
                  <label className="text-sm text-muted-foreground">{f.name}{f.required ? " *" : ""}</label>
                  {f.type === "text" && (
                    <Input value={(val as string) || ""} onChange={(e) => setVal(e.target.value)} />
                  )}
                  {f.type === "number" && (
                    <Input
                      type="number"
                      value={(typeof val === "number" || typeof val === "string") ? (val as any) : ""}
                      onChange={(e) => setVal(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  )}
                  {f.type === "date" && (
                    <Input type="date" value={(val as string) || ""} onChange={(e) => setVal(e.target.value)} />
                  )}
                  {f.type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <Checkbox checked={!!val} onCheckedChange={(v) => setVal(!!v)} id={`cb_${f.id}`} />
                    </div>
                  )}
                  {f.type === "select" && (
                    <select
                      className="border rounded-md bg-background text-sm px-2 py-1"
                      value={(val as string) || ""}
                      onChange={(e) => setVal(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {(f.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {f.type === "multi-select" && (
                    <div className="flex flex-wrap gap-2">
                      {(f.options || []).map((opt) => {
                        const list = (Array.isArray(val) ? (val as string[]) : []);
                        const checked = list.includes(opt);
                        return (
                          <label key={opt} className="inline-flex items-center gap-2 border rounded-md px-2 py-1 text-xs">
                            <Checkbox checked={checked} onCheckedChange={(v) => {
                              const curr = new Set(list);
                              if (v) curr.add(opt); else curr.delete(opt);
                              setVal(Array.from(curr));
                            }} />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

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
