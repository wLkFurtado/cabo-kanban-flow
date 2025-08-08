import { Droppable, Draggable } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { Card, List } from "@/state/kanbanStore";

interface KanbanListProps {
  list: List;
  cards: Card[];
}

export function KanbanList({ list, cards }: KanbanListProps) {
  return (
    <section className="w-72 shrink-0">
      <header className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-sm font-semibold text-foreground">{list.title}</h2>
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
                      <KanbanCard card={card} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </section>
  );
}
