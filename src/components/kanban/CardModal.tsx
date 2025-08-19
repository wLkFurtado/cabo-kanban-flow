import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { Card as TCard, Label as TLabel, LabelColor, Member as TMember, CustomField } from "@/state/kanbanTypes";
import { parseISO, format } from "date-fns";
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
    const customFields = board?.customFields || [];
    
    // Validate required custom fields
    const requiredMissing = customFields.some(field => {
      if (!field.required) return false;
      const value = custom[field.id];
      if (value === undefined || value === null) return true;
      if (typeof value === "string" && value.trim() === "") return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    });
    
    if (requiredMissing) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    updateCard(boardId, card.id, {
      title,
      description,
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

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
          {/* Basic Fields */}
          <div>
            <label className="text-sm text-muted-foreground">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do cartão"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do cartão"
              className="min-h-[80px] resize-none"
            />
          </div>

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

          {/* Custom Fields */}
          {board?.customFields?.filter(f => f).map((field) => {
            const value = custom[field.id];
            const isRequired = field.required;
            
            return (
              <div key={field.id}>
                <label className="text-sm text-muted-foreground">
                  {field.name}
                  {isRequired && " *"}
                </label>
                
                {field.type === "text" && (
                  <Input
                    value={value as string || ""}
                    onChange={(e) => setCustom(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.helpText}
                  />
                )}
                
                {field.type === "textarea" && (
                  <Textarea
                    value={value as string || ""}
                    onChange={(e) => setCustom(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.helpText}
                    className="min-h-[80px] resize-none"
                  />
                )}
                
                {field.type === "number" && (
                  <Input
                    type="number"
                    value={value as number || ""}
                    onChange={(e) => setCustom(prev => ({ ...prev, [field.id]: e.target.value ? Number(e.target.value) : "" }))}
                    placeholder={field.helpText}
                  />
                )}
                
                {field.type === "date" && (
                  <Input
                    type="date"
                    value={value as string || ""}
                    onChange={(e) => setCustom(prev => ({ ...prev, [field.id]: e.target.value }))}
                  />
                )}
                
                {field.type === "checkbox" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      checked={!!value}
                      onCheckedChange={(checked) => setCustom(prev => ({ ...prev, [field.id]: checked }))}
                      id={`checkbox-${field.id}`}
                    />
                    <Label htmlFor={`checkbox-${field.id}`} className="text-sm">
                      {field.helpText || "Marcar se aplicável"}
                    </Label>
                  </div>
                )}
                
                {field.type === "select" && (
                  <Select
                    value={value as string || ""}
                    onValueChange={(selectedValue) => setCustom(prev => ({ ...prev, [field.id]: selectedValue }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.helpText || "Selecione uma opção"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {field.type === "multi-select" && (
                  <div className="mt-2 space-y-2">
                    {field.options?.map((option) => {
                      const selectedValues = Array.isArray(value) ? value as string[] : [];
                      const isChecked = selectedValues.includes(option);
                      
                      return (
                        <label key={option} className="inline-flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = Array.isArray(value) ? value as string[] : [];
                              const updated = checked
                                ? [...current, option]
                                : current.filter(v => v !== option);
                              setCustom(prev => ({ ...prev, [field.id]: updated }));
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                
                {field.helpText && field.type !== "checkbox" && (
                  <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                )}
              </div>
            );
          })}
          </div>
        </ScrollArea>

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
