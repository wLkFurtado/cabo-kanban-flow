import React from 'react';
import { cn } from '../../lib/utils';
import { useDragAndDrop, DropZoneData } from '../../hooks/useDragAndDrop';
import { usePautasStore } from '../../state/pautasStore';
import { Evento } from '../../state/pautasTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useProfiles } from '../../hooks/useProfiles';

interface TimeSlotProps {
  date: Date;
  hour: number;
  dayIndex: number;
  eventos: Evento[];
  onEventClick?: (eventId: string) => void;
  className?: string;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  date,
  hour,
  dayIndex,
  eventos,
  onEventClick,
  className
}) => {
  const { handleDragOver, handleDrop } = useDragAndDrop();
  const { adicionarEvento } = usePautasStore();
  const { profiles } = useProfiles();
  const [isHovered, setIsHovered] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  // Função auxiliar para obter o primeiro nome de um usuário pelo ID
  const getFirstName = (userId: string | undefined): string => {
    if (!userId) return '';
    const profile = profiles?.find(p => p.id === userId);
    if (!profile) return '';
    const fullName = profile.full_name || profile.display_name || profile.email || '';
    return fullName.split(' ')[0]; // Retorna apenas o primeiro nome
  };

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
  
  // Limitar quantidade de eventos visíveis por slot para evitar poluição visual
  const maxVisible = 2;
  const visibleEvents = expanded ? eventosNoSlot : eventosNoSlot.slice(0, maxVisible);
  const hiddenCount = Math.max(0, eventosNoSlot.length - maxVisible);

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
      
      {/* Eventos no slot - visual refinado e sem sobreposição */}
      <div className="p-1 space-y-1" aria-expanded={expanded}>
        {visibleEvents.map((evento) => {
          const filmakerName = getFirstName(evento.filmmaker);
          const fotografoName = getFirstName(evento.fotografo);
          const jornalistaName = getFirstName(evento.jornalista);
          const redeName = getFirstName(evento.rede);
          
          return (
            <div
              key={evento.id}
              className="text-[11px] p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeftColor: evento.cor, borderLeftWidth: '4px' }}
              title={`${evento.titulo} • ${format(evento.dataInicio, 'HH:mm', { locale: ptBR })} - ${format(evento.dataFim, 'HH:mm', { locale: ptBR })}`}
              onClick={() => onEventClick && onEventClick(evento.id)}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {evento.titulo}
              </div>
              <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                {format(evento.dataInicio, 'HH:mm', { locale: ptBR })} - 
                {format(evento.dataFim, 'HH:mm', { locale: ptBR })}
              </div>
              {(filmakerName || fotografoName || jornalistaName || redeName) && (
                <div className="text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                  {filmakerName && (
                    <div>Filmmaker: {filmakerName}</div>
                  )}
                  {fotografoName && (
                    <div>Fotógrafo: {fotografoName}</div>
                  )}
                  {jornalistaName && (
                    <div>Jornalista: {jornalistaName}</div>
                  )}
                  {redeName && (
                    <div>Rede: {redeName}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {hiddenCount > 0 && !expanded && (
          <div className="flex items-center gap-1 px-2 py-1">
            <span className="text-[11px] text-gray-600 dark:text-gray-400">+{hiddenCount} eventos</span>
            <button
              type="button"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              aria-label="Expandir"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
        {expanded && eventosNoSlot.length > maxVisible && (
          <div className="flex items-center gap-1 px-2 py-1">
            <button
              type="button"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              aria-label="Colapsar"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      
      {/* Removido horário dentro do slot para evitar sobreposição com conteúdo.
          O horário é exibido na primeira coluna da agenda. */}
    </div>
  );
};