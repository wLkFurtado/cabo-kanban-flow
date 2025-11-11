import React, { useState } from "react";
import { Droppable, Draggable, type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { Card, List } from "@/state/kanbanTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableText } from "@/components/editable/EditableText";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanListProps {
  list: List;
  cards: Card[];
  boardId: string;
  dragHandleProps?: DraggableProvidedDragHandleProps;
  onAddCard: (listId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
 }

export function KanbanList({ list, cards, boardId, dragHandleProps, onAddCard, onDeleteCard, onRenameList, onDeleteList }: KanbanListProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleAddCard = () => {
    if (newTitle.trim()) {
      onAddCard(list.id, newTitle.trim());
      setNewTitle("");
      setAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setAdding(false);
      setNewTitle("");
    }
  };

  return (
    <div className="w-72 bg-gray-100 rounded-lg p-2 h-fit max-h-full flex flex-col">
      {/* List Header */}
      <div className="flex items-center justify-between mb-2 px-2 py-1">
        <div className="flex items-center gap-2 flex-1">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
          <EditableText
            value={list.title}
            onSubmit={(newTitle) => onRenameList(list.id, newTitle)}
            className="font-semibold text-sm text-gray-800 flex-1"
            placeholder="Nome da lista"
          />
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir lista</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja excluir esta lista? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteList(list.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cards Container */}
      <Droppable droppableId={list.id} type="card">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 min-h-2 transition-colors duration-200",
              snapshot.isDraggingOver && "bg-gray-200 rounded-md"
            )}
          >
            {cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                boardId={boardId}
                onDeleteCard={onDeleteCard}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Card Section */}
      <div className="mt-2">
        {adding ? (
          <div className="space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Insira um título para este cartão..."
              className="text-sm bg-white border-gray-300 focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddCard}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
              >
                Adicionar cartão
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 h-8"
              >
                ✕
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setAdding(true)}
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-200 text-sm font-normal p-2 h-8"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar um cartão
          </Button>
        )}
      </div>
    </div>
  );
}
