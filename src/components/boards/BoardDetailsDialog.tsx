import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBoardsStore } from "@/state/boardsStore";
import { useToast } from "@/hooks/use-toast";

interface BoardDetailsDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardDetailsDialog({ boardId, open, onOpenChange }: BoardDetailsDialogProps) {
  const board = useBoardsStore((s) => s.boards[boardId]);
  const updateBoard = useBoardsStore((s) => s.updateBoard);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>("");

  useEffect(() => {
    if (open && board) {
      setTitle(board.title || "");
      setIcon(board.icon || "");
      setDescription(board.description || "");
      setColor(board.color || "");
    }
  }, [open, boardId]);

  if (!board) return null;

  const onSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    updateBoard(boardId, {
      title: trimmed,
      icon: icon?.trim() || undefined,
      description: description?.trim() || undefined,
      color: color || undefined,
    });
    toast({ title: "Detalhes atualizados" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar detalhes do board</DialogTitle>
          <DialogDescription>Atualize informações do seu board.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Emoji</label>
              <Input
                aria-label="Emoji do board"
                placeholder="😀"
                value={icon}
                maxLength={2}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <div className="col-span-4">
              <label className="block text-sm font-medium mb-1">Título</label>
              <Input
                aria-label="Título do board"
                placeholder="Nome do board"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSave()}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <Textarea
              aria-label="Descrição do board"
              placeholder="Sobre o que é este board?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cor</label>
            <div className="flex items-center gap-3">
              <input
                aria-label="Cor do board"
                type="color"
                value={color || "#7c3aed"}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded-md border border-input bg-background p-1"
              />
              <Input
                aria-label="Cor em texto"
                placeholder="#7c3aed ou hsl(262, 83%, 58%)"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
