import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanList } from "./KanbanList";
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
}

export function KanbanBoard({ boardId, listsOrder, lists, cardsByList, onMoveCard }: KanbanBoardProps) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    onMoveCard(source.droppableId, destination.droppableId, source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pr-4">
        {listsOrder.map((listId) => (
          <KanbanList key={listId} list={lists[listId]} cards={cardsByList[listId] || []} boardId={boardId} />
        ))}
      </div>
    </DragDropContext>
  );
}
