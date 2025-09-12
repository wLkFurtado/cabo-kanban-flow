import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUserDemands } from "@/hooks/useUserDemands";

interface AgendaCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
}

export function AgendaCalendar({ selectedDate, onDateSelect }: AgendaCalendarProps) {
  const { getDatesWithDemands } = useUserDemands();

  // Get dates that have demands
  const datesWithDemands = getDatesWithDemands();

  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={ptBR}
        className={cn("rounded-md border pointer-events-auto")}
        modifiers={{
          hasDemand: (date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return datesWithDemands.has(dateStr);
          }
        }}
        modifiersStyles={{
          hasDemand: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            fontWeight: 'bold',
          }
        }}
      />
    </div>
  );
}