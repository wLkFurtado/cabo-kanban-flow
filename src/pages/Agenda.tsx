import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, AlertTriangle, Clock, Pencil, Trash } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserDemands } from "@/hooks/useUserDemands";
import { useBoardsStore } from "@/state/boards/store";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { DemandCard } from "@/components/agenda/DemandCard";
import { EventModal } from "@/components/agenda/EventModal";
import { CardModal } from "@/components/kanban/CardModal";
import { Card } from "@/state/kanbanTypes";
import { Seo } from "@/components/seo/Seo";
// Removido o toggle de visualização (Semana)
import { useEvents } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";


export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<import("@/hooks/useEvents").AgendaEvent | null>(null);
  
  // Estado para modal de confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const { getDemandsByDate, getOverdueDemands, getDueSoonDemands } = useUserDemands();
  const { boards } = useBoardsStore();
  const { events, deleteEvent } = useEvents();

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const dayDemands = selectedDateStr ? getDemandsByDate(selectedDateStr) : [];
  const dayEvents = selectedDateStr
    ? (events || []).filter((ev) => {
        const startStr = format(new Date(ev.start_date), 'yyyy-MM-dd');
        const endStr = format(new Date(ev.end_date), 'yyyy-MM-dd');
        return startStr <= selectedDateStr && selectedDateStr <= endStr;
      })
    : [];
  const overdueDemands = getOverdueDemands();
  const dueSoonDemands = getDueSoonDemands();
  const hasSidebar = overdueDemands.length > 0 || dueSoonDemands.length > 0;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Abre o painel lateral mostrando todos os eventos do dia
      // O usuário pode editar, excluir ou criar novo evento a partir dali
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

  const handleEventModalOpenChange = (open: boolean) => {
    setIsEventModalOpen(open);
    if (!open) {
      setEventBeingEdited(null);
    }
    if (open) {
      setIsSheetOpen(false);
    }
  };

  const formatSelectedDate = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <>
      <Seo 
        title="Agenda - Kanban Board" 
        description="Gerencie suas pautas e compromissos diários com nossa agenda interativa."
      />
      
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas pautas e compromissos
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className={cn(hasSidebar ? "lg:col-span-5" : "lg:col-span-6") }>
              <div className="bg-card rounded-lg border p-8 min-h-[70vh]">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Calendário de Demandas</h2>
                </div>
                <AgendaCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  events={events || []}
                />
              </div>
            </div>
            {hasSidebar && (
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

              {/* Seção de Próximas Demandas removida */}
            </div>
            )}
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
              {/* Eventos do dia */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Pautas ({dayEvents.length})</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEventBeingEdited(null);
                      setIsEventModalOpen(true);
                    }}
                  >
                    + Nova Pauta
                  </Button>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento para este dia.</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between gap-2 border rounded-md p-2">
                        <div className="text-sm min-w-0">
                          <div className="font-medium truncate">{ev.title}</div>
                          <div className="text-muted-foreground truncate">
                            {format(new Date(ev.start_date), 'HH:mm', { locale: ptBR })} - {format(new Date(ev.end_date), 'HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEventBeingEdited(ev);
                              setIsEventModalOpen(true);
                              setIsSheetOpen(false);
                            }}
                            aria-label="Editar pauta"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              // Abre o modal de confirmação
                              setEventToDelete(ev.id);
                              setDeleteConfirmOpen(true);
                            }}
                            aria-label="Excluir pauta"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Demandas do dia */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Demandas ({dayDemands.length})</h3>
              </div>
              {dayDemands.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma demanda para este dia.</p>
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

        <EventModal
          open={isEventModalOpen}
          onOpenChange={handleEventModalOpenChange}
          selectedDate={selectedDate}
          eventToEdit={eventBeingEdited}
        />

        {/* Modal de confirmação de exclusão */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir pauta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A pauta será removida permanentemente da agenda.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteConfirmOpen(false);
                setEventToDelete(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (eventToDelete) {
                    deleteEvent(eventToDelete);
                  }
                  setDeleteConfirmOpen(false);
                  setEventToDelete(null);
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}