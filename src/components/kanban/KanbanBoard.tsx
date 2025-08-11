import React, { useState } from "react";
import { DragDropContext, DropResult, Droppable, Draggable } from "@hello-pangea/dnd";
import { KanbanList } from "./KanbanList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Card, List } from "@/state/kanbanTypes";

interface KanbanBoardProps {
  boardId: string;
  listsOrder: string[];
  lists: Record<string, List>;
  cardsByList: Record<string, Card[]>;
  onMoveCard: (
    fromListId: string,
    toListId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  onMoveList: (fromIndex: number, toIndex: number) => void;
  onAddList: (title: string) => void;
}

export function KanbanBoard({ boardId, listsOrder, lists, cardsByList, onMoveCard, onMoveList, onAddList }: KanbanBoardProps) {
  const [adding, setAdding] = useState(false);
  const [newList, setNewList] = useState("");

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "LIST") {
      onMoveList(source.index, destination.index);
      return;
    }

    onMoveCard(source.droppableId, destination.droppableId, source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`board-${boardId}-lists`} direction="horizontal" type="LIST">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4 overflow-x-auto pb-4 pr-4">
            {listsOrder.map((listId, index) => (
              <Draggable key={listId} draggableId={listId} index={index}>
                {(dragProvided) => (
                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                    <KanbanList 
                      list={lists[listId]} 
                      cards={cardsByList[listId] || []} 
                      boardId={boardId}
                      dragHandleProps={dragProvided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {/* Add List composer */}
            <div className="w-72 shrink-0">
              {adding ? (
                <div className="rounded-lg bg-secondary/40 border p-2">
                  <div className="flex gap-2">
                    <Input value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="Título da lista" />
                    <Button size="sm" onClick={() => { const t = newList.trim(); if (t) { onAddList(t); setNewList(""); setAdding(false);} }}>Adicionar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewList(""); }}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="w-72 justify-start" onClick={() => setAdding(true)}>+ Adicionar lista</Button>
              )}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
