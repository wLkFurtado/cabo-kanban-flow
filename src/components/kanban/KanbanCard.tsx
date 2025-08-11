import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Card as TCard } from "@/state/kanbanTypes";
import { format, isPast, isWithinInterval, addDays, parseISO } from "date-fns";
import { useState } from "react";
import { CardModal } from "./CardModal";
import { useBoardsStore } from "@/state/boardsStore";
import { Badge } from "@/components/ui/badge";

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
  boardId: string;
}

export function KanbanCard({ card, boardId }: KanbanCardProps) {
  const due = card.dueDate ? parseISO(card.dueDate) : undefined;
  const isOverdue = due ? isPast(due) : false;
  const isSoon =
    due && !isOverdue
      ? isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 3) })
      : false;

  const [open, setOpen] = useState(false);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <>
      <article className="group rounded-md bg-card shadow-sm hover:shadow-md transition-shadow border p-3 cursor-pointer" onClick={() => setOpen(true)}>
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

        {/* Custom field badges */}
        {(() => {
          const board = useBoardsStore.getState().boards[boardId];
          const fields = (board?.customFields || []).filter((f) => f.showOnCard).sort((a,b)=>a.order-b.order).slice(0, 2);
          if (!fields.length) return null;
          const vals = (card as any).custom || {};
          return (
            <div className="mt-2 flex flex-wrap gap-1">
              {fields.map((f) => {
                const v = (vals as any)[f.id];
                if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return null;
                let text = "";
                if (f.type === "date" && typeof v === "string" && v) {
                  try { text = format(parseISO(v.length>10? v : `${v}`), "dd MMM"); } catch { text = String(v); }
                } else if (f.type === "checkbox") {
                  text = v ? "✓" : "✕";
                } else if (f.type === "multi-select" && Array.isArray(v)) {
                  text = (v as string[]).join(", ");
                } else {
                  text = String(v);
                }
                return (
                  <Badge key={f.id} variant="secondary">
                    {f.name}: {text}
                  </Badge>
                );
              })}
            </div>
          );
        })()}

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
      <CardModal open={open} onOpenChange={setOpen} boardId={boardId} card={card} />
    </>
  );
}
