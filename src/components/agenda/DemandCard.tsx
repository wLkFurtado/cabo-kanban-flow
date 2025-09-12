import { Card } from "@/state/kanbanTypes";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DemandCardProps {
  card: Card;
  boardTitle: string;
  onClick: () => void;
}

export function DemandCard({ card, boardTitle, onClick }: DemandCardProps) {
  const now = new Date();
  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue = dueDate && isBefore(dueDate, now);
  const isDueSoon = dueDate && isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 3));

  const getPriorityFromLabels = () => {
    const redLabels = card.labels.filter(l => l.color === "red").length;
    const orangeLabels = card.labels.filter(l => l.color === "orange").length;
    if (redLabels > 0) return "high";
    if (orangeLabels > 0) return "medium";
    return "low";
  };

  const priority = getPriorityFromLabels();

  return (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md bg-card",
        isOverdue && "border-destructive bg-destructive/5",
        isDueSoon && "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2 text-foreground">
          {card.title}
        </h4>
        {(isOverdue || isDueSoon) && (
          <AlertTriangle 
            className={cn(
              "h-4 w-4 ml-2 flex-shrink-0",
              isOverdue ? "text-destructive" : "text-orange-500"
            )} 
          />
        )}
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        Board: {boardTitle}
      </div>

      {dueDate && (
        <div className="flex items-center text-xs mb-2">
          <Clock className="h-3 w-3 mr-1" />
          <span className={cn(
            isOverdue && "text-destructive font-medium",
            isDueSoon && "text-orange-600 dark:text-orange-400 font-medium"
          )}>
            {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
            {isOverdue && " (Atrasado)"}
            {isDueSoon && " (Vence em breve)"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {card.labels.slice(0, 3).map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className={cn(
                "text-xs px-1 py-0",
                label.color === "red" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
                label.color === "orange" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
                label.color === "yellow" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
                label.color === "green" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                label.color === "blue" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
                label.color === "purple" && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
              )}
            >
              {label.name}
            </Badge>
          ))}
        </div>

        <div className="flex -space-x-1">
          {card.members.slice(0, 3).map((member) => (
            <div
              key={member.id}
              className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border border-background"
              title={member.name}
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                member.name.slice(0, 2).toUpperCase()
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}