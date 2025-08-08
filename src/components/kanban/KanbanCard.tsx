import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Card as TCard } from "@/state/kanbanTypes";
import { format, isPast, isWithinInterval, addDays, parseISO } from "date-fns";

const labelColorClass: Record<string, string> = {
  green: "bg-[hsl(var(--label-green))]",
  yellow: "bg-[hsl(var(--label-yellow))]",
  orange: "bg-[hsl(var(--label-orange))]",
  red: "bg-[hsl(var(--label-red))]",
  purple: "bg-[hsl(var(--label-purple))]",
  blue: "bg-[hsl(var(--label-blue))]",
};

interface KanbanCardProps {
  card: TCard;
}

export function KanbanCard({ card }: KanbanCardProps) {
  const due = card.dueDate ? parseISO(card.dueDate) : undefined;
  const isOverdue = due ? isPast(due) : false;
  const isSoon =
    due && !isOverdue
      ? isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 3) })
      : false;

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <article className="group rounded-md bg-card shadow-sm hover:shadow-md transition-shadow border p-3">
      {/* Labels */}
      {card.labels?.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <span
              key={l.id}
              className={cn(
                "inline-block h-2 w-8 rounded-full",
                labelColorClass[l.color]
              )}
              aria-label={`Label ${l.name}`}
            />
          ))}
        </div>
      ) : null}

      <h3 className="text-sm font-medium leading-snug">{card.title}</h3>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {card.members?.slice(0, 3).map((m) => (
            <Avatar key={m.id} className="size-6 border bg-muted">
              <AvatarFallback className="text-[10px]">
                {initials(m.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>

        {due ? (
          <time
            dateTime={card.dueDate}
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-md border",
              isOverdue
                ? "text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]"
                : isSoon
                ? "text-[hsl(var(--warning))] border-[hsl(var(--warning))]"
                : "text-muted-foreground border-muted"
            )}
            aria-label="Data de vencimento"
            title={format(due, "dd/MM/yyyy")}
          >
            {format(due, "dd MMM")}
          </time>
        ) : null}
      </div>
    </article>
  );
}
