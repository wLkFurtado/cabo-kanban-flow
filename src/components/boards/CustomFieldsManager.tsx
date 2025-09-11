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
  
  const isTemplate = !!board.isTemplate;
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
              disabled={isTemplate}
            />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Tipo</Label>
            <Select value={f.type} onValueChange={(v) => updateCustomField(boardId, f.id, { type: v as any, options: (v.includes("select") ? (opts.length?opts:["Opção 1"]) : undefined) })} disabled={isTemplate}>
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
              <Switch checked={!!f.required} onCheckedChange={(v) => updateCustomField(boardId, f.id, { required: v })} id={`req_${f.id}`} disabled={isTemplate} />
              <Label htmlFor={`req_${f.id}`} className="text-xs">Obrigatório</Label>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={!!f.showOnCard} onCheckedChange={(v) => updateCustomField(boardId, f.id, { showOnCard: v })} id={`show_${f.id}`} disabled={isTemplate} />
              <Label htmlFor={`show_${f.id}`} className="text-xs">Mostrar no card</Label>
            </div>
          </div>
          <div className="col-span-0 md:col-span-0 flex items-center justify-end gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => reorderCustomFields(boardId, f.order, Math.max(0, f.order-1))} 
              title="Mover para cima"
              disabled={isTemplate}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => reorderCustomFields(boardId, f.order, Math.min(fields.length-1, f.order+1))} 
              title="Mover para baixo"
              disabled={isTemplate}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => deleteCustomField(boardId, f.id)} 
              title="Excluir"
              disabled={isTemplate}
            >
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
                  <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} className="max-w-sm" disabled={isTemplate} />
                  <Button variant="ghost" size="icon" onClick={() => removeOption(idx)} title="Remover" disabled={isTemplate}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={addOption} className="mt-1" disabled={isTemplate}>
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
        <Button size="sm" onClick={handleAdd} disabled={isTemplate}>
          <Plus className="size-4 mr-1" /> Novo campo
        </Button>
      </div>
      
      {isTemplate && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
          <div className="flex items-start gap-2">
            <div className="text-amber-600 dark:text-amber-400">🎨</div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Board Template - Solicitação de Arte
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Este é um board template com campos pré-definidos para solicitações de arte. Os campos não podem ser modificados.
              </p>
            </div>
          </div>
        </div>
      )}

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isTemplate ? "Este board template não possui campos personalizados configurados." : "Nenhum campo ainda. Crie o primeiro."}
        </p>
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
