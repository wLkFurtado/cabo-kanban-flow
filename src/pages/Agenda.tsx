import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserDemands } from "@/hooks/useUserDemands";
import { useBoardsStore } from "@/state/boardsStore";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { DemandCard } from "@/components/agenda/DemandCard";
import { CardModal } from "@/components/kanban/CardModal";
import { Card } from "@/state/kanbanTypes";
import { Seo } from "@/components/seo/Seo";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  const { getDemandsByDate, getUpcomingDemands, getOverdueDemands, getDueSoonDemands } = useUserDemands();
  const { boards } = useBoardsStore();

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const dayDemands = selectedDateStr ? getDemandsByDate(selectedDateStr) : [];
  const upcomingDemands = getUpcomingDemands(5);
  const overdueDemands = getOverdueDemands();
  const dueSoonDemands = getDueSoonDemands();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsSheetOpen(true);
    }
  };

  const handleDemandClick = (card: Card, boardId: string) => {
    setSelectedCard(card);
    setSelectedBoardId(boardId);
  };

  const handleCloseCardModal = () => {
    setSelectedCard(null);
    setSelectedBoardId("");
  };

  const formatSelectedDate = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <>
      <Seo 
        title="Agenda - Kanban Board" 
        description="Gerencie seus eventos e compromissos diários com nossa agenda interativa."
      />
      
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seus eventos e compromissos
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className="lg:col-span-5">
              <div className="bg-card rounded-lg border p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Calendário de Demandas</h2>
                </div>
                <AgendaCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </div>
            </div>

            <div className="space-y-3">
              {overdueDemands.length > 0 && (
                <div className="bg-card rounded-lg border border-destructive p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h3 className="font-semibold text-destructive">Atrasadas ({overdueDemands.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {overdueDemands.slice(0, 3).map((demand) => (
                      <DemandCard
                        key={demand.card.id}
                        card={demand.card}
                        boardTitle={demand.boardTitle}
                        onClick={() => handleDemandClick(demand.card, demand.boardId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {dueSoonDemands.length > 0 && (
                <div className="bg-card rounded-lg border border-orange-500 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <h3 className="font-semibold text-orange-600 dark:text-orange-400">Vencem em Breve ({dueSoonDemands.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {dueSoonDemands.slice(0, 3).map((demand) => (
                      <DemandCard
                        key={demand.card.id}
                        card={demand.card}
                        boardTitle={demand.boardTitle}
                        onClick={() => handleDemandClick(demand.card, demand.boardId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Próximas Demandas</h3>
                {upcomingDemands.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma demanda com prazo definido.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingDemands.map((demand) => (
                      <DemandCard
                        key={demand.card.id}
                        card={demand.card}
                        boardTitle={demand.boardTitle}
                        onClick={() => handleDemandClick(demand.card, demand.boardId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="left" className="w-96">
            <SheetHeader>
              <SheetTitle>
                {selectedDate ? formatSelectedDate(selectedDate) : 'Demandas do Dia'}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">
                  Demandas ({dayDemands.length})
                </h3>
              </div>

              {dayDemands.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma demanda para este dia.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayDemands
                    .sort((a, b) => {
                      const timeA = a.card.dueDate || '';
                      const timeB = b.card.dueDate || '';
                      return timeA.localeCompare(timeB);
                    })
                    .map((demand) => (
                      <DemandCard
                        key={demand.card.id}
                        card={demand.card}
                        boardTitle={demand.boardTitle}
                        onClick={() => handleDemandClick(demand.card, demand.boardId)}
                      />
                    ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {selectedCard && selectedBoardId && (
          <CardModal
            open={true}
            onOpenChange={handleCloseCardModal}
            card={selectedCard}
            boardId={selectedBoardId}
          />
        )}
      </div>
    </>
  );
}