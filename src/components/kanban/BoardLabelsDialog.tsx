import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BoardLabel } from '@/state/kanbanTypes';
import {
  useBoardLabels,
  useCreateBoardLabel,
  useUpdateBoardLabel,
  useDeleteBoardLabel,
} from '@/hooks/useBoardLabels';
import { Pencil, Trash, Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BoardLabelsDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardLabelsDialog({
  boardId,
  open,
  onOpenChange,
}: BoardLabelsDialogProps) {
  const { data: boardLabels = [], isLoading } = useBoardLabels(boardId);
  const createLabel = useCreateBoardLabel();
  const updateLabel = useUpdateBoardLabel();
  const deleteLabel = useDeleteBoardLabel();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<BoardLabel | null>(null);

  const handleStartEdit = (label: BoardLabel) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      await updateLabel.mutateAsync({
        id: editingId,
        boardId,
        name: editName,
        color: editColor,
      });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleCreateLabel = async () => {
    if (newLabelName.trim()) {
      await createLabel.mutateAsync({
        boardId,
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setNewLabelName('');
      setNewLabelColor('#6366f1');
      setShowCreateForm(false);
    }
  };

  const handleDeleteLabel = async () => {
    if (labelToDelete) {
      await deleteLabel.mutateAsync({
        id: labelToDelete.id,
        boardId,
      });
      setLabelToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Etiquetas do Board</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Carregando...
                </p>
              ) : boardLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma etiqueta criada ainda
                </p>
              ) : (
                boardLabels.map((label) => {
                  const isEditing = editingId === label.id;

                  return (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {isEditing ? (
                        <>
                          {/* Edit Mode */}
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1"
                            placeholder="Nome da etiqueta"
                            autoFocus
                          />
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-10 h-9 rounded border cursor-pointer"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* View Mode */}
                          <Badge
                            className="flex-1"
                            style={{ backgroundColor: label.color, color: '#fff' }}
                          >
                            {label.name}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(label)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setLabelToDelete(label);
                              setDeleteConfirmOpen(true);
                            }}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })
              )}

              {/* Create New Label Form */}
              {showCreateForm && (
                <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Nova Etiqueta</span>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da etiqueta"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateLabel();
                        }
                      }}
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-10 h-9 rounded border cursor-pointer"
                    />
                  </div>
                  <Button
                    onClick={handleCreateLabel}
                    disabled={!newLabelName.trim()}
                    className="w-full"
                    size="sm"
                  >
                    Criar
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            {!showCreateForm && (
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar nova etiqueta
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etiqueta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etiqueta "
              {labelToDelete?.name}"? Esta ação não pode ser desfeita. As
              etiquetas aplicadas aos cartões permanecerão, mas não estarão mais
              vinculadas a esta etiqueta do board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLabel}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
