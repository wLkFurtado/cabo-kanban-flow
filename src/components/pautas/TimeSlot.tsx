import React from 'react';
import { cn } from '../../lib/utils';
import { useDragAndDrop, DropZoneData } from '../../hooks/useDragAndDrop';
import { usePautasStore } from '../../state/pautasStore';
import { Evento } from '../../state/pautasTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimeSlotProps {
  date: Date;
  hour: number;
  dayIndex: number;
  eventos: Evento[];
  className?: string;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  date,
  hour,
  dayIndex,
  eventos,
  className
}) => {
  const { handleDragOver, handleDrop } = useDragAndDrop();
  const { adicionarEvento } = usePautasStore();
  const [isHovered, setIsHovered] = React.useState(false);

  const dropZone: DropZoneData = {
    dayIndex,
    hour,
    date
  };

  const handleSlotDrop = (event: React.DragEvent) => {
    const result = handleDrop(event, dropZone);
    
    // Funcionalidade de drag and drop removida
    
    setIsHovered(false);
  };

  const eventosNoSlot = eventos.filter(evento => {
    const eventoHour = evento.dataInicio.getHours();
    const eventoDate = format(evento.dataInicio, 'yyyy-MM-dd');
    const slotDate = format(date, 'yyyy-MM-dd');
    
    return eventoHour === hour && eventoDate === slotDate;
  });

  return (
    <div
      className={cn(
        'relative min-h-[60px] border-b border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-200',
        isHovered && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600',
        className
      )}
      onDragOver={(e) => {
        handleDragOver(e);
        setIsHovered(true);
      }}
      onDragLeave={() => setIsHovered(false)}
      onDrop={handleSlotDrop}
    >
      {/* Indicador de drop zone */}
      {isHovered && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 flex items-center justify-center">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Soltar aqui
          </span>
        </div>
      )}
      
      {/* Eventos no slot */}
      <div className="p-1 space-y-1">
        {eventosNoSlot.map((evento) => (
          <div
            key={evento.id}
            className="text-xs p-2 rounded border-l-4 bg-white dark:bg-gray-800 shadow-sm"
            style={{ borderLeftColor: evento.cor }}
          >
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {evento.titulo}
            </div>
            <div className="text-gray-600 dark:text-gray-400 truncate">
              {format(evento.dataInicio, 'HH:mm', { locale: ptBR })} - 
              {format(evento.dataFim, 'HH:mm', { locale: ptBR })}
            </div>

          </div>
        ))}
      </div>
      
      {/* Horário do slot */}
      <div className="absolute top-1 left-1 text-xs text-gray-500 dark:text-gray-400">
        {hour.toString().padStart(2, '0')}:00
      </div>
    </div>
  );
};