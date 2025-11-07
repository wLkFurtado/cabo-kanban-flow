import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePautasStore } from '../../state/pautasStore';
import { TimeSlot } from './TimeSlot';
import { cn } from '../../lib/utils';
import { Evento } from '../../state/pautasTypes';

interface WeeklyAgendaProps {
  eventos: Evento[];
  onEventClick?: (eventId: string) => void;
  onCreateEvent?: (date: Date, hour: number) => void;
}

export const WeeklyAgenda: React.FC<WeeklyAgendaProps> = ({
  eventos,
  onEventClick,
  onCreateEvent
}) => {
  const { filtros } = usePautasStore();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Calcular início da semana (segunda-feira)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  
  // Gerar dias da semana
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Horários de trabalho (8h às 20h)
  const workingHours = Array.from({ length: 13 }, (_, i) => i + 8);

  // Filtrar eventos da semana atual
  const weekEvents = useMemo(() => {
    return eventos.filter(evento => {
      const eventoDate = evento.dataInicio;
      return weekDays.some(day => isSameDay(eventoDate, day));
    }).filter(evento => {
      // Aplicar filtros
      if (filtros.tipos.length > 0 && !filtros.tipos.includes(evento.tipo)) return false;
      if (filtros.status.length > 0 && !filtros.status.includes(evento.status)) return false;
      return true;
    });
  }, [eventos, weekDays, filtros]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    if (onCreateEvent) {
      onCreateEvent(date, hour);
    }
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isCurrentHour = (hour: number) => {
    const now = new Date();
    return now.getHours() === hour && isToday(weekStart);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <div className="flex flex-col">
              <span>Agenda Semanal</span>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {format(weekStart, 'MMMM yyyy', { locale: ptBR })}
              </span>
            </div>
          </CardTitle>
          
          {/* Navegação da semana */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="min-w-[120px]"
            >
              {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale: ptBR })}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          {/* Grid da agenda */}
          <div className="grid grid-cols-8 min-w-[1000px]">
            {/* Header com dias da semana */}
            <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm">
              Horário
            </div>
            
            {weekDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 p-3 text-center shadow-sm',
                  isToday(day) && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                )}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  'text-lg font-semibold',
                  isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                )}>
                  {format(day, 'dd', { locale: ptBR })}
                </div>
              </div>
            ))}
            
            {/* Linhas de horário */}
            {workingHours.map(hour => (
              <React.Fragment key={hour}>
                {/* Coluna de horário */}
                <div className={cn(
                  'border-b border-gray-200 dark:border-gray-700 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800',
                  isCurrentHour(hour) && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                )}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Slots de tempo para cada dia */}
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = weekEvents.filter(evento => 
                    isSameDay(evento.dataInicio, day)
                  );
                  
                  return (
                    <TimeSlot
                      key={`${day.toISOString()}-${hour}`}
                      date={day}
                      hour={hour}
                      dayIndex={dayIndex}
                      eventos={dayEvents}
                      onEventClick={onEventClick}
                      className={cn(
                        'hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer',
                        isToday(day) && 'bg-blue-50/30 dark:bg-blue-900/10',
                        isCurrentHour(hour) && 'bg-yellow-50/50 dark:bg-yellow-900/10',
                        selectedHour === hour && 'ring-2 ring-blue-400 dark:ring-blue-500'
                      )}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Legenda */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 rounded"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded"></div>
              <span>Horário atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-600 rounded"></div>
              <span>Disponível para drop</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};