import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Card as TCard, LabelColor } from "@/state/kanbanTypes";
import { format, isPast, isWithinInterval, addDays, parseISO } from "date-fns";
import { useState } from "react";
import { CardModal } from "./CardModal";
import { useBoardsStore } from "@/state/boardsStore";
import { Badge } from "@/components/ui/badge";

const labelColorClass: Record<LabelColor, string> = {
  green: "bg-[hsl(var(--label-green))] text-white",
  yellow: "bg-[hsl(var(--label-yellow))] text-black",
  orange: "bg-[hsl(var(--label-orange))] text-white", 
  red: "bg-[hsl(var(--label-red))] text-white",
  purple: "bg-[hsl(var(--label-purple))] text-white",
  blue: "bg-[hsl(var(--label-blue))] text-white",
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
      <article className="group rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-200 border border-border/50 hover:border-border p-4 cursor-pointer bg-gradient-to-br from-card to-card/80" onClick={() => setOpen(true)}>
        {/* Card image placeholder */}
        <div className="mb-3 aspect-video bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-lg">📝</span>
          </div>
        </div>

        {/* Labels */}
        {card.labels?.length ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {card.labels.map((l) => (
              <Badge
                key={l.id}
                className={cn("text-xs px-2.5 py-1 font-medium rounded-full", labelColorClass[l.color])}
                aria-label={`Label ${l.name}`}
              >
                {l.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <h3 className="text-sm font-semibold leading-snug mb-2 text-card-foreground">{card.title}</h3>

        {/* Communication-specific fixed fields */}
        {(() => {
          const vals = (card as any).custom || {};
          
          // Fixed field keys for communication
          const tituloEventoVal = vals.tituloEvento;
          const assuntoPrincipalVal = vals.assuntoPrincipal;
          const descricaoBreveVal = vals.descricaoBreve;
          const dataEventoVal = vals.dataEvento;
          const localVal = vals.local;
          const classificacaoVal = vals.classificacao;
          const chamadaAcaoVal = vals.chamadaAcao;
          const dividirCardsVal = vals.dividirCards;
          const numeroCardsVal = vals.numeroCards;
          const observacoesVal = vals.observacoes;

          const hasAnyCustomData = tituloEventoVal || assuntoPrincipalVal || descricaoBreveVal || dataEventoVal || localVal || classificacaoVal || chamadaAcaoVal || dividirCardsVal || observacoesVal;
          
          if (!hasAnyCustomData) return null;

          return (
            <div className="mt-2 space-y-2">
              {/* Event Title - Main highlight */}
              {tituloEventoVal && (
                <div className="text-[12px] font-medium text-foreground line-clamp-1">
                  {String(tituloEventoVal)}
                </div>
              )}
              
              {/* Subject - Secondary line */}
              {assuntoPrincipalVal && (
                <div className="text-[11px] text-muted-foreground line-clamp-1">
                  {String(assuntoPrincipalVal)}
                </div>
              )}
              
              {/* Brief Description */}
              {descricaoBreveVal && !assuntoPrincipalVal && (
                <div className="text-[11px] text-muted-foreground line-clamp-1">
                  {String(descricaoBreveVal)}
                </div>
              )}
              
              {/* Event Info Section - Date and Location */}
              {(dataEventoVal || localVal) && (
                <div className="flex items-center gap-1 flex-wrap">
                  {dataEventoVal && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      📅 {(() => {
                        try { 
                          return format(parseISO(String(dataEventoVal)), "dd/MM"); 
                        } catch { 
                          return String(dataEventoVal).slice(0, 10); 
                        }
                      })()}
                    </Badge>
                  )}
                  {localVal && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      📍 {String(localVal).length > 15 ? `${String(localVal).slice(0, 15)}...` : String(localVal)}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Call to Action */}
              {chamadaAcaoVal && (
                <div className="text-[10px] text-muted-foreground line-clamp-1">
                  💬 {String(chamadaAcaoVal)}
                </div>
              )}
              
              {/* Bottom row: Classification and Social Media indicators */}
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1">
                  {classificacaoVal && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-800 border-amber-200">
                      {String(classificacaoVal)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {dividirCardsVal && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-800 border-blue-200">
                      📱 {numeroCardsVal ? `${numeroCardsVal} cards` : "Redes Sociais"}
                    </Badge>
                  )}
                  {observacoesVal && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-800 border-orange-200">
                      ⚠️ Obs
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bottom section */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-1">
            {card.members?.slice(0, 3).map((m) => (
              <Avatar key={m.id} className="size-7 border-2 border-background shadow-sm">
                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {card.members && card.members.length > 3 && (
              <div className="size-7 rounded-full border-2 border-background bg-muted flex items-center justify-center shadow-sm">
                <span className="text-xs text-muted-foreground font-medium">+{card.members.length - 3}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Comments indicator */}
            {card.comments && card.comments.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-xs">💬</span>
                <span className="text-xs font-medium">{card.comments.length}</span>
              </div>
            )}
            
            {/* Due date */}
            {due ? (
              <time
                dateTime={card.dueDate}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-medium",
                  isOverdue
                    ? "text-destructive border-destructive/20 bg-destructive/5"
                    : isSoon
                    ? "text-warning border-warning/20 bg-warning/5"
                    : "text-muted-foreground border-border bg-muted/30"
                )}
                aria-label="Data de vencimento"
                title={format(due, "dd/MM/yyyy")}
              >
                {format(due, "dd MMM")}
              </time>
            ) : null}
          </div>
        </div>
      </article>
      <CardModal open={open} onOpenChange={setOpen} boardId={boardId} card={card} />
    </>
  );
}
