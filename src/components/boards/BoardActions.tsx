import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useBoardsStore } from "@/state/boardsStore";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Pencil, Trash, Palette } from "lucide-react";
import React from "react";
import { BoardDetailsDialog } from "@/components/boards/BoardDetailsDialog";

interface BoardActionsProps {
  boardId: string;
  onRename?: () => void;
  onDeleted?: () => void;
}

export function BoardActions({ boardId, onRename, onDeleted }: BoardActionsProps) {
  const deleteBoard = useBoardsStore((s) => s.deleteBoard);
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleDelete = () => {
    deleteBoard(boardId);
    toast({ title: "Board apagado" });
    onDeleted?.();
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
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename?.();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
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
              onSelect={(e) => e.preventDefault()}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" /> Apagar…
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogTitle>Apagar este board?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta ação não pode ser desfeita. Isso apagará permanentemente o board e seus dados locais.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Apagar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      <BoardDetailsDialog boardId={boardId} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </AlertDialog>
  );
}
