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

  return (
    <section className="w-72 shrink-0">
      <header className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Mover lista"
            className="text-muted-foreground hover:text-foreground cursor-grab"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-semibold text-foreground truncate">
            <EditableText value={list.title} onSubmit={(v) => updateListTitle(boardId, list.id, v)} className="text-sm font-semibold text-foreground" />
          </h2>
          <span className="ml-1 text-[10px] leading-none rounded-full bg-muted px-2 py-1 text-muted-foreground">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Adicionar cartão" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais opções">
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
      </header>

      <div className="rounded-lg bg-secondary/40 border p-2 min-h-10">
        <Droppable droppableId={list.id} type="CARD">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={"flex flex-col gap-2 transition-colors " + (snapshot.isDraggingOver ? "bg-secondary/60" : "")}
            >
              {cards.map((card, index) => (
                <Draggable key={card.id} draggableId={card.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={"select-none " + (dragSnapshot.isDragging ? "rotate-[0.2deg]" : "")}
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
        <div className="mt-2 px-1">
          {adding ? (
            <div className="flex gap-2">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título do cartão" />
              <Button size="sm" onClick={() => { if (newTitle.trim()) { addCard(boardId, list.id, newTitle.trim()); setNewTitle(""); setAdding(false);} }}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(""); }}>Cancelar</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setAdding(true)}>+ Adicionar cartão</Button>
          )}
        </div>
      </div>
    </section>
  );
}
