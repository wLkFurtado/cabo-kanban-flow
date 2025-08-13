import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBoardsStore } from "@/state/boardsStore";
import type { CustomField } from "@/state/kanbanTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ArrowUp, ArrowDown, Plus } from "lucide-react";

interface Props { boardId: string }

export function CustomFieldsManager({ boardId }: Props) {
  const board = useBoardsStore((s) => s.boards[boardId]);
  const addCustomField = useBoardsStore((s) => s.addCustomField);
  const updateCustomField = useBoardsStore((s) => s.updateCustomField);
  const deleteCustomField = useBoardsStore((s) => s.deleteCustomField);
  const reorderCustomFields = useBoardsStore((s) => s.reorderCustomFields);

  if (!board) return null;
  const fields = (board.customFields || []).slice().sort((a,b)=>a.order-b.order);

  const handleAdd = () => {
    addCustomField(boardId, { name: "Novo campo", type: "text", required: false, showOnCard: false });
  };

  const FieldRow = ({ f }: { f: CustomField }) => {
    const isSelect = f.type === "select" || f.type === "multi-select";
    const opts = (f.options || []);

    const addOption = () => {
      const next = [...opts, `Opção ${opts.length + 1}`];
      updateCustomField(boardId, f.id, { options: next });
    };

    const updateOption = (idx: number, value: string) => {
      const next = opts.slice();
      next[idx] = value;
      updateCustomField(boardId, f.id, { options: next });
    };

    const removeOption = (idx: number) => {
      const next = opts.filter((_, i) => i !== idx);
      updateCustomField(boardId, f.id, { options: next });
    };

    return (
      <div className="rounded-md border p-3 space-y-3">
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <Label className="text-xs">Nome</Label>
            <Input
              value={f.name}
              onChange={(e) => updateCustomField(boardId, f.id, { name: e.target.value })}
            />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Tipo</Label>
            <Select value={f.type} onValueChange={(v) => updateCustomField(boardId, f.id, { type: v as any, options: (v.includes("select") ? (opts.length?opts:["Opção 1"]) : undefined) })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="textarea">Texto longo</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="multi-select">Multi-select</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={!!f.required} onCheckedChange={(v) => updateCustomField(boardId, f.id, { required: v })} id={`req_${f.id}`} />
              <Label htmlFor={`req_${f.id}`} className="text-xs">Obrigatório</Label>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={!!f.showOnCard} onCheckedChange={(v) => updateCustomField(boardId, f.id, { showOnCard: v })} id={`show_${f.id}`} />
              <Label htmlFor={`show_${f.id}`} className="text-xs">Mostrar no card</Label>
            </div>
          </div>
          <div className="col-span-0 md:col-span-0 flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => reorderCustomFields(boardId, f.order, Math.max(0, f.order-1))} title="Mover para cima">
              <ArrowUp className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => reorderCustomFields(boardId, f.order, Math.min(fields.length-1, f.order+1))} title="Mover para baixo">
              <ArrowDown className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteCustomField(boardId, f.id)} title="Excluir">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {isSelect && (
          <div className="space-y-2">
            <Label className="text-xs">Opções</Label>
            <div className="space-y-2">
              {opts.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} className="max-w-sm" />
                  <Button variant="ghost" size="icon" onClick={() => removeOption(idx)} title="Remover">
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={addOption} className="mt-1">
              <Plus className="size-4 mr-1" /> Adicionar opção
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Campos personalizados</h3>
        <Button size="sm" onClick={handleAdd}><Plus className="size-4 mr-1" /> Novo campo</Button>
      </div>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum campo ainda. Crie o primeiro.</p>
      ) : (
        <div className="space-y-3">
          {fields.map((f) => (
            <FieldRow key={f.id} f={f} />
          ))}
        </div>
      )}
    </section>
  );
}
