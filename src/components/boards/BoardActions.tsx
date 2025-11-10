import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
// Usar Supabase via hook de boards para apagar boards reais
import { useBoards } from "../../hooks/useBoards";
import { useToast } from "../ui/use-toast";
import { MoreVertical, Pencil, Trash, Palette } from "lucide-react";
import React from "react";
import { BoardDetailsDialog } from "./BoardDetailsDialog";

interface BoardActionsProps {
  boardId: string;
  onRename?: () => void;
  onDeleted?: () => void;
}

export function BoardActions({ boardId, onRename, onDeleted }: BoardActionsProps) {
  const { deleteBoardAsync } = useBoards();
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteBoardAsync(boardId);
      // Sucesso: o hook já exibe toast em onSuccess
      onDeleted?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Erro ao apagar board", description: message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/60"
            aria-label="Ações do board"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRename?.();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setDetailsOpen(true);
            }}
          >
            <Palette className="mr-2 h-4 w-4" /> Editar detalhes…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            {/* prevent Radix from closing instantly and allow AlertDialog */}
            <DropdownMenuItem
              onSelect={(e: Event) => e.preventDefault()}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" /> Apagar…
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <AlertDialogTitle>Apagar este board?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta ação não pode ser desfeita. Isso apagará permanentemente o board e seus dados no servidor.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Apagando..." : "Apagar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      <BoardDetailsDialog boardId={boardId} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </AlertDialog>
  );
}
