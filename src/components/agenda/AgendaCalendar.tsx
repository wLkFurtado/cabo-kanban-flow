import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEventsStore } from "@/state/eventsStore";

interface AgendaCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
}

export function AgendaCalendar({ selectedDate, onDateSelect }: AgendaCalendarProps) {
  const { events } = useEventsStore();

  // Get dates that have events
  const datesWithEvents = new Set(events.map(event => event.date));

  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={ptBR}
        className={cn("rounded-md border pointer-events-auto")}
        modifiers={{
          hasEvent: (date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return datesWithEvents.has(dateStr);
          }
        }}
        modifiersStyles={{
          hasEvent: {
            backgroundColor: 'hsl(var(--accent))',
            color: 'hsl(var(--accent-foreground))',
            fontWeight: 'bold',
          }
        }}
      />
    </div>
  );
}