import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useKanbanStore } from "@/state/kanbanStore";
import { KanbanList } from "./KanbanList";

export function KanbanBoard() {
  const listsOrder = useKanbanStore((s) => s.listsOrder);
  const lists = useKanbanStore((s) => s.lists);
  const cardsByList = useKanbanStore((s) => s.cardsByList);
  const moveCard = useKanbanStore((s) => s.moveCard);

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    moveCard(source.droppableId, destination.droppableId, source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pr-4">
        {listsOrder.map((listId) => (
          <KanbanList key={listId} list={lists[listId]} cards={cardsByList[listId] || []} />
        ))}
      </div>
    </DragDropContext>
  );
}
