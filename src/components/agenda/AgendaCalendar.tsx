import { format, startOfWeek as startOfWeekFn, addDays, isSameDay, startOfMonth, isSameMonth, isToday, startOfDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { useUserDemands } from "../../hooks/useUserDemands";
import type { UserDemandWithBoard } from "../../hooks/useUserDemands";
import type { AgendaEvent } from "../../hooks/useEvents";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";


interface AgendaCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  events?: AgendaEvent[];
}

export function AgendaCalendar({ selectedDate, onDateSelect, events = [] }: AgendaCalendarProps) {
  const { getDatesWithDemands, getDemandsByDate } = useUserDemands();


  // Get dates that have demands
  const datesWithDemands = getDatesWithDemands();

  // Map events by date (supports multi-day events)
  const eventsByDate: Record<string, AgendaEvent[]> = (() => {
    const map: Record<string, AgendaEvent[]> = {};
    for (const ev of events) {
      // Normalize to start-of-day in local timezone to avoid previous-day repetition
      const start = startOfDay(new Date(ev.start_date));
      const end = startOfDay(new Date(ev.end_date));
      let cursor = start;
      const endStr = format(end, "yyyy-MM-dd");
      while (format(cursor, "yyyy-MM-dd") <= endStr) {
        const key = format(cursor, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        cursor = addDays(cursor, 1);
      }
    }
    return map;
  })();

  // Month grid renderer
  const renderMonthGrid = () => {
    const baseDate = selectedDate ?? new Date();
    const monthStart = startOfMonth(baseDate);
    // Iniciar semana na segunda-feira (Brasil) para reduzir confusão
    const gridStart = startOfWeekFn(monthStart, { weekStartsOn: 1 });
    const monthLabel = format(baseDate, "MMMM yyyy", { locale: ptBR });
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      cells.push(addDays(gridStart, i));
    }

    // Cabeçalho com nomes dos dias da semana
    const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
      format(addDays(gridStart, i), "EEE", { locale: ptBR })
    );

    return (
      <div className="w-full h-full">
        {/* Mês de referência + navegação */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold">
            {monthLabel}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateSelect(startOfMonth(subMonths(baseDate, 1)))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateSelect(startOfMonth(new Date()))}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateSelect(startOfMonth(addMonths(baseDate, 1)))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 w-full mb-1">
          {weekdayLabels.map((label, idx) => (
            <div
              key={`wd-${idx}`}
              className="text-xs font-medium text-muted-foreground text-center"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6 gap-1 w-full h-full">
        {cells.map((date, idx) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(date, monthStart);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const demands = getDemandsByDate(dateStr);
          const dayEvents = eventsByDate[dateStr] || [];
          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={cn(
                "h-full p-1 rounded-md text-left text-xs overflow-hidden border",
                isSelected && "border-primary bg-primary/10",
                !isCurrentMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "inline-block font-semibold",
                  isToday(date) ? "bg-yellow-200 text-yellow-800 rounded px-1" : ""
                )}
              >
                {format(date, "d")}
              </span>
              <div className="mt-1 space-y-0.5 max-h-[5rem] overflow-hidden">
                {demands.slice(0, 3).map((d: UserDemandWithBoard) => (
                  <div key={d.card.id} className="flex items-start gap-1 truncate">
                    <span className="mt-1.5 mr-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate leading-tight text-[10px]">
                      {d.card.title}
                    </span>
                  </div>
                ))}
                {dayEvents.slice(0, 3).map((ev) => (
                  <div key={`ev-${ev.id}`} className="flex items-start gap-1 truncate">
                    <span className="mt-1.5 mr-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="truncate leading-tight text-[10px]">
                      {ev.title}
                    </span>
                  </div>
                ))}
                {demands.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+ {demands.length - 3} mais</span>
                )}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+ {dayEvents.length - 3} eventos</span>
                )}
              </div>
            </button>
          );
        })}
        </div>
      </div>
    );
  };


  return renderMonthGrid();
}