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
      <article className="group rounded-md bg-card shadow-sm hover:shadow-md transition-shadow border p-3 cursor-pointer" onClick={() => setOpen(true)}>
        {/* Labels */}
        {card.labels?.length ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {card.labels.map((l) => (
              <Badge
                key={l.id}
                className={cn("text-xs px-2 py-0.5", labelColorClass[l.color])}
                aria-label={`Label ${l.name}`}
              >
                {l.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <h3 className="text-sm font-medium leading-snug">{card.title}</h3>

        {/* Communication-specific custom fields */}
        {(() => {
          const board = useBoardsStore.getState().boards[boardId];
          const fields = board?.customFields || [];
          const vals = (card as any).custom || {};
          
          // Get specific field values by correct names
          const tituloEvento = fields.find(f => f.name.includes("Título/Nome do Evento"))?.id;
          const assuntoPrincipal = fields.find(f => f.name.includes("Assunto Principal"))?.id;
          const descricaoBreve = fields.find(f => f.name.includes("Descrição Breve"))?.id;
          const dataEvento = fields.find(f => f.name.includes("Data do Evento"))?.id;
          const local = fields.find(f => f.name.includes("Local"))?.id;
          const classificacao = fields.find(f => f.name.includes("Classificação"))?.id;
          const chamadaAcao = fields.find(f => f.name.includes("Chamada para Ação"))?.id;
          const dividirCards = fields.find(f => f.name.includes("Dividir em Cards para Redes Sociais"))?.id;
          const numeroCards = fields.find(f => f.name.includes("Número de Cards"))?.id;
          const observacoes = fields.find(f => f.name.includes("Observações Especiais"))?.id;
          
          const tituloEventoVal = tituloEvento ? vals[tituloEvento] : null;
          const assuntoPrincipalVal = assuntoPrincipal ? vals[assuntoPrincipal] : null;
          const descricaoBreveVal = descricaoBreve ? vals[descricaoBreve] : null;
          const dataEventoVal = dataEvento ? vals[dataEvento] : null;
          const localVal = local ? vals[local] : null;
          const classificacaoVal = classificacao ? vals[classificacao] : null;
          const chamadaAcaoVal = chamadaAcao ? vals[chamadaAcao] : null;
          const dividirCardsVal = dividirCards ? vals[dividirCards] : null;
          const numeroCardsVal = numeroCards ? vals[numeroCards] : null;
          const observacoesVal = observacoes ? vals[observacoes] : null;

          const hasAnyCustomData = tituloEventoVal || assuntoPrincipalVal || descricaoBreveVal || dataEventoVal || localVal || classificacaoVal || chamadaAcaoVal || dividirCardsVal || numeroCardsVal || observacoesVal;
          
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
                  {dividirCardsVal === "Sim" && (
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
