import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useBoards } from "../../hooks/useBoards";
import { useToast } from "../ui/use-toast";

interface BoardCreateDialogProps {
  trigger: React.ReactNode;
  initialTitle?: string;
  onCreated?: (boardId: string) => void;
}

export function BoardCreateDialog({ trigger, initialTitle = "", onCreated }: BoardCreateDialogProps) {
  const navigate = useNavigate();
  const { createBoard, isCreating } = useBoards();
  const { toast } = useToast();

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
      
      // Create board using Supabase
      const board = await createBoard({
        title: name,
        description: `Board criado com as etapas: ${cleanStages.join(", ")}`,
        visibility: 'private',
        initialStages: cleanStages,
      });

      toast({
        title: "Board criado com sucesso!",
        description: `O board "${name}" foi criado e salvo no banco de dados.`,
      });

      onCreated?.(board.id);
      navigate(`/board/${board.id}`);
      setOpen(false);
      
      // Reset form
      setTitle("");
      setStages(["A fazer", "Fazendo", "Concluído"]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao criar o board. Tente novamente.";
      toast({
        title: "Erro ao criar board",
        description: errorMessage,
        variant: "destructive",
      });
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
            <Input id="board-title" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Ex.: Planejamento de conteúdo" />
          </div>

          <div className="space-y-2">
            <Label>Etapas iniciais</Label>
            <div className="space-y-2">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`Etapa ${idx + 1}`}
                    value={stage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => changeStage(idx, e.target.value)}
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
          <Button type="button" onClick={handleSubmit} disabled={submitting || isCreating || !title.trim() || stages.filter((s) => s.trim()).length === 0}>
            {submitting || isCreating ? "Criando..." : "Criar board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
