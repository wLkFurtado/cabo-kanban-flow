import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoardsStore } from "@/state/boardsStore";

interface BoardCreateDialogProps {
  trigger: React.ReactNode;
  initialTitle?: string;
  onCreated?: (boardId: string) => void;
}

export function BoardCreateDialog({ trigger, initialTitle = "", onCreated }: BoardCreateDialogProps) {
  const navigate = useNavigate();
  const createBoard = useBoardsStore((s) => s.createBoard);
  const updateBoard = useBoardsStore((s) => s.updateBoard);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [stages, setStages] = useState<string[]>(["A fazer", "Fazendo", "Concluído"]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTitle || "");
  }, [initialTitle, open]);

  const addStage = () => setStages((arr) => [...arr, ""]);
  const removeStage = (index: number) =>
    setStages((arr) => (arr.length > 1 ? arr.filter((_, i) => i !== index) : arr));
  const changeStage = (index: number, value: string) =>
    setStages((arr) => arr.map((s, i) => (i === index ? value : s)));

  const handleSubmit = async () => {
    const name = title.trim();
    const cleanStages = stages.map((s) => s.trim()).filter((s) => s.length > 0);
    if (!name || cleanStages.length === 0) return;

    try {
      setSubmitting(true);
      const boardId = createBoard(name);

      // Build fresh lists structure replacing defaults
      const listIds = cleanStages.map((_, i) => `l_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}_${i}`);
      const listsOrder = listIds;
      const lists = listIds.reduce<Record<string, { id: string; title: string; position: number }>>((acc, id, i) => {
        acc[id] = { id, title: cleanStages[i], position: i };
        return acc;
      }, {});
      const cardsByList = listIds.reduce<Record<string, any[]>>((acc, id) => {
        acc[id] = [];
        return acc;
      }, {});

      updateBoard(boardId, { lists, listsOrder, cardsByList });

      onCreated?.(boardId);
      navigate(`/board/${boardId}`);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo board</DialogTitle>
          <DialogDescription>Defina o nome e as etapas iniciais do seu board.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-title">Nome do board</Label>
            <Input id="board-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Planejamento de conteúdo" />
          </div>

          <div className="space-y-2">
            <Label>Etapas iniciais</Label>
            <div className="space-y-2">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`Etapa ${idx + 1}`}
                    value={stage}
                    onChange={(e) => changeStage(idx, e.target.value)}
                  />
                  <Button variant="outline" type="button" onClick={() => removeStage(idx)} aria-label="Remover etapa">
                    Remover
                  </Button>
                </div>
              ))}
              <div>
                <Button variant="secondary" type="button" onClick={addStage}>
                  Adicionar etapa
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || !title.trim() || stages.filter((s) => s.trim()).length === 0}>
            {submitting ? "Criando..." : "Criar board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
