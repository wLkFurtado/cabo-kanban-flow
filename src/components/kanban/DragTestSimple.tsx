import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TestItem {
  id: string;
  content: string;
}

const initialItems: TestItem[] = [
  { id: '1', content: 'Item 1' },
  { id: '2', content: 'Item 2' },
  { id: '3', content: 'Item 3' },
];

export function DragTestSimple() {
  const [items, setItems] = useState(initialItems);

  const handleOnDragEnd = (result: DropResult) => {
    console.log("🧪 DragTestSimple - onDragEnd:", result);
    
    if (!result.destination) {
      console.log("❌ Sem destino");
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    console.log("✅ Reordenando items:", { from: result.source.index, to: result.destination.index });
    setItems(newItems);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🧪 Teste Simples de Drag and Drop</h3>
      
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="test-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-3 bg-white border rounded shadow-sm cursor-move ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      {item.content}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}