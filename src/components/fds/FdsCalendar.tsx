import { useMemo } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FdsCalendarProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
}

export function FdsCalendar({ month, onMonthChange, selectedDate, onSelectDate }: FdsCalendarProps) {
  const { days, weekendPairs } = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const weekends = days.filter((d) => {
      const dow = d.getDay(); // 0=sun,6=sat
      return dow === 0 || dow === 6;
    });
    
    // Agrupar sábados e domingos consecutivos
    const weekendPairs: Array<{ saturday: Date; sunday?: Date }> = [];
    for (let i = 0; i < weekends.length; i++) {
      const current = weekends[i];
      const dow = current.getDay();
      
      if (dow === 6) { // Sábado
        const nextDay = weekends[i + 1];
        const sunday = nextDay && nextDay.getDay() === 0 ? nextDay : undefined;
        weekendPairs.push({ saturday: current, sunday });
        if (sunday) i++; // Pular o domingo já processado
      } else if (dow === 0) { // Domingo sem sábado anterior no mês
        weekendPairs.push({ saturday: current, sunday: undefined });
      }
    }
    
    return { days, weekendPairs };
  }, [month]);

  const isSelected = (pair: { saturday: Date; sunday?: Date }) => {
    if (!selectedDate) return false;
    const selectedStr = selectedDate.toDateString();
    return pair.saturday.toDateString() === selectedStr || 
           (pair.sunday && pair.sunday.toDateString() === selectedStr);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onMonthChange(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {weekendPairs.map((pair) => {
            const saturdayDay = format(pair.saturday, "dd");
            const sundayDay = pair.sunday ? format(pair.sunday, "dd") : null;
            const dateRange = sundayDay ? `${saturdayDay}-${sundayDay}` : saturdayDay;
            const monthYear = format(pair.saturday, "MM");
            
            return (
              <Button
                key={pair.saturday.toISOString()}
                variant={isSelected(pair) ? "default" : "secondary"}
                className="justify-between"
                onClick={() => onSelectDate(pair.saturday)}
              >
                <span className="text-sm font-medium">Sáb-Dom</span>
                <span className="text-sm">{dateRange}/{monthYear}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}