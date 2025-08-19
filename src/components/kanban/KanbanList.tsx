import React, { useState } from "react";
import { Droppable, Draggable, type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { Card, List } from "@/state/kanbanTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boardsStore";
import { EditableText } from "@/components/editable/EditableText";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanListProps {
  list: List;
  cards: Card[];
  boardId: string;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

export function KanbanList({ list, cards, boardId, dragHandleProps }: KanbanListProps) {
  const updateListTitle = useBoardsStore((s) => s.updateListTitle);
  const addCard = useBoardsStore((s) => s.addCard);
  const deleteList = useBoardsStore((s) => s.deleteList);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Get column color based on list title
  const getColumnColor = (title: string) => {
    const lowTitle = title.toLowerCase();
    if (lowTitle.includes('fazer') || lowTitle.includes('todo') || lowTitle.includes('backlog')) {
      return 'hsl(var(--column-backlog))';
    }
    if (lowTitle.includes('fazendo') || lowTitle.includes('doing') || lowTitle.includes('progresso')) {
      return 'hsl(var(--column-doing))';
    }
    if (lowTitle.includes('feito') || lowTitle.includes('done') || lowTitle.includes('concluí')) {
      return 'hsl(var(--column-done))';
    }
    return 'hsl(var(--column-todo))';
  };

  return (
    <section className="w-80 shrink-0">
      <div className="bg-muted/30 rounded-xl shadow-sm border">
        {/* Column header with color indicator */}
        <header className="relative px-4 py-3 border-b bg-gradient-to-r from-background to-muted/20 rounded-t-xl">
          {/* Color indicator line */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
            style={{ backgroundColor: getColumnColor(list.title) }}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                aria-label="Mover lista"
                className="text-muted-foreground hover:text-foreground cursor-grab p-1 hover:bg-muted/50 rounded"
                {...dragHandleProps}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">
                  <EditableText value={list.title} onSubmit={(v) => updateListTitle(boardId, list.id, v)} />
                </h2>
                <span className="flex-shrink-0 text-xs rounded-full bg-primary/10 text-primary px-2 py-1 font-medium">
                  {cards.length}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Excluir esta etapa removerá todos os cartões nela. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteList(boardId, list.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        {/* Cards container */}
        <div className="p-3 min-h-20">
          <Droppable droppableId={list.id} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex flex-col gap-3 transition-all duration-200 rounded-lg p-2",
                  snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/20" : ""
                )}
              >
                {cards.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={cn(
                          "select-none transition-transform duration-200",
                          dragSnapshot.isDragging ? "rotate-[2deg] scale-[1.02] shadow-xl" : ""
                        )}
                      >
                        <KanbanCard card={card} boardId={boardId} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add card section */}
          <div className="mt-3">
            {adding ? (
              <div className="space-y-2 p-3 bg-card rounded-lg border shadow-sm">
                <Input 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="Título do cartão" 
                  className="border-0 bg-muted/50 focus:bg-background"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => { 
                      if (newTitle.trim()) { 
                        addCard(boardId, list.id, newTitle.trim()); 
                        setNewTitle(""); 
                        setAdding(false);
                      } 
                    }}
                    className="flex-1"
                  >
                    Adicionar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { 
                      setAdding(false); 
                      setNewTitle(""); 
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50" 
                onClick={() => setAdding(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar cartão
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
