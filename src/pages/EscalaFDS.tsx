import { useState } from "react";
import { FdsCalendar } from "@/components/fds/FdsCalendar";
import { WeekendTeamForm } from "@/components/fds/WeekendTeamForm";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EscalaFDS() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | undefined>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <FdsCalendar month={month} onMonthChange={setMonth} selectedDate={selected} onSelectDate={setSelected} />
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Selecione um sábado ou domingo para configurar a equipe do final de semana.
            {selected && (
              <div className="mt-2 text-foreground">
                Data selecionada: {format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <WeekendTeamForm weekendDate={selected} />
    </div>
  );
}