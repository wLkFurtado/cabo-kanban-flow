import { useAgendaCalendarStore } from "@/state/agendaCalendarStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AgendaViewToggle({ className }: { className?: string }) {
  const { viewMode, setViewMode } = useAgendaCalendarStore();

  const modes: Array<{ value: "month" | "week"; label: string }> = [
    { value: "month", label: "Mês" },
    { value: "week", label: "Semana" },
  ];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {modes.map((mode) => (
        <Button
          key={mode.value}
          size="sm"
          variant={viewMode === mode.value ? "default" : "outline"}
          onClick={() => setViewMode(mode.value)}
        >
          {mode.label}
        </Button>
      ))}
    </div>
  );
}