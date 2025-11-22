import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { KanbanList } from "./KanbanList";
import { Card, List } from "@/state/kanbanTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface KanbanBoardProps {
  lists: List[];
  cards: Record<string, Card[]>;
  boardId: string;
  onMoveCard: (cardId: string, sourceListId: string, destinationListId: string, destinationIndex: number) => void;
  onMoveList: (listId: string, destinationIndex: number) => void;
  onAddList: (title: string) => void;
  onAddCard: (listId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  lists,
  cards,
  boardId,
  onMoveCard,
  onMoveList,
  onAddList,
  onAddCard,
  onDeleteCard,
  onRenameList,
  onDeleteList,
}) => {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "list") {
      onMoveList(result.draggableId, destination.index);
      return;
    }

    if (type === "card") {
      onMoveCard(
        result.draggableId,
        source.droppableId,
        destination.droppableId,
        destination.index
      );
    }
  };

  const advanceCard = (card: Card) => {
    const currentIndex = lists.findIndex((l) => l.id === card.list_id);
    if (currentIndex < 0) return;
    const nextList = lists[currentIndex + 1];
    if (!nextList) return;
    const destinationListId = nextList.id;
    const sourceListId = card.list_id;
    const destinationIndex = (cards[destinationListId]?.length ?? 0);
    onMoveCard(card.id, sourceListId, destinationListId, destinationIndex);
  };

  const handleAddList = () => {
    if (newListTitle.trim()) {
      onAddList(newListTitle.trim());
      setNewListTitle("");
      setIsAddingList(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddList();
    } else if (e.key === 'Escape') {
      setIsAddingList(false);
      setNewListTitle("");
    }
  };

  return (
    <div className="h-full bg-gray-50 p-4 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full pb-4">
            <Droppable droppableId="board" type="list" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-3 h-full"
                >
                  {lists.map((list, index) => (
                    <Draggable key={list.id} draggableId={list.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            transition-transform duration-200
                            ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}
                          `}
                        >
                          <KanbanList
                            list={list}
                            cards={cards[list.id] || []}
                            boardId={boardId}
                            dragHandleProps={provided.dragHandleProps}
                            onAddCard={onAddCard}
                            onDeleteCard={onDeleteCard}
                            onAdvanceCard={advanceCard}
                            onRenameList={onRenameList}
                            onDeleteList={onDeleteList}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add List Section */}
            <div className="w-72 shrink-0">
              {isAddingList ? (
                <div className="bg-gray-100 rounded-lg p-2">
                  <Input
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Insira o título da lista..."
                    className="mb-2 text-sm bg-white border-gray-300 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddList}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                    >
                      Adicionar lista
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle("");
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 h-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingList(true)}
                  variant="ghost"
                  className="w-full justify-start bg-gray-200 hover:bg-gray-300 text-gray-700 border-none text-sm font-normal p-3 h-auto rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar uma lista
                </Button>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
