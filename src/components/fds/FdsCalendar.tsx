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
  const { days, weekends } = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const weekends = days.filter((d) => {
      const dow = d.getDay(); // 0=sun,6=sat
      return dow === 0 || dow === 6;
    });
    return { days, weekends };
  }, [month]);

  const isSelected = (d: Date) => selectedDate && d.toDateString() === selectedDate.toDateString();

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
          {weekends.map((d) => (
            <Button
              key={d.toISOString()}
              variant={isSelected(d) ? "default" : "secondary"}
              className="justify-between"
              onClick={() => onSelectDate(d)}
            >
              <span className="text-sm font-medium">{format(d, "EEEE", { locale: ptBR })}</span>
              <span className="text-sm">{format(d, "dd/MM")}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}