import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { Card, List } from "@/state/kanbanTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boardsStore";
import { EditableText } from "@/components/editable/EditableText";
interface KanbanListProps {
  list: List;
  cards: Card[];
  boardId: string;
}

export function KanbanList({ list, cards, boardId }: KanbanListProps) {
  const updateListTitle = useBoardsStore((s) => s.updateListTitle);
  const addCard = useBoardsStore((s) => s.addCard);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  return (
    <section className="w-72 shrink-0">
      <header className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-sm font-semibold text-foreground">
          <EditableText value={list.title} onSubmit={(v) => updateListTitle(boardId, list.id, v)} className="text-sm font-semibold text-foreground" />
        </h2>
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
