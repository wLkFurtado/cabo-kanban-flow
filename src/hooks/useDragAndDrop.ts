import { useState, useRef } from 'react';

export interface DragData {
  type: 'event';
  data: any;
}

export interface DropZoneData {
  dayIndex: number;
  hour: number;
  date: Date;
}

export const useDragAndDrop = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (data: DragData, event: React.DragEvent) => {
    setIsDragging(true);
    setDragData(data);
    
    // Configurar dados para transferência
    event.dataTransfer.setData('application/json', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Criar imagem customizada de drag
    if (dragImageRef.current) {
      event.dataTransfer.setDragImage(dragImageRef.current, 10, 10);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragData(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent, dropZone: DropZoneData) => {
    event.preventDefault();
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json')) as DragData;
      return { dragData: data, dropZone };
    } catch (error) {
      console.error('Erro ao processar drop:', error);
      return null;
    }
  };

  return {
    isDragging,
    dragData,
    dragImageRef,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  };
};