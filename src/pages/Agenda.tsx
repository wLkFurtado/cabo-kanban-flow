import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEventsStore } from "@/state/eventsStore";
import { Event } from "@/state/eventTypes";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { EventCard } from "@/components/agenda/EventCard";
import { EventForm } from "@/components/agenda/EventForm";
import { toast } from "@/hooks/use-toast";
import { Seo } from "@/components/seo/Seo";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [showForm, setShowForm] = useState(false);

  const { events, addEvent, updateEvent, deleteEvent, getEventsByDate } = useEventsStore();

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const dayEvents = selectedDateStr ? getEventsByDate(selectedDateStr) : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsSheetOpen(true);
      setShowForm(false);
      setEditingEvent(undefined);
    }
  };

  const handleCreateEvent = () => {
    setShowForm(true);
    setEditingEvent(undefined);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    toast({
      title: "Evento removido",
      description: "O evento foi removido com sucesso.",
    });
  };

  const handleSubmitEvent = (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso.",
      });
    } else {
      addEvent(eventData);
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso.",
      });
    }
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(undefined);
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Calendário</h2>
                <AgendaCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Eventos Recentes</h3>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento cadastrado ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {events
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
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
                {selectedDate ? formatSelectedDate(selectedDate) : 'Eventos do Dia'}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              {!showForm && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      Eventos ({dayEvents.length})
                    </h3>
                    <Button size="sm" onClick={handleCreateEvent}>
                      <Plus className="h-4 w-4 mr-1" />
                      Novo
                    </Button>
                  </div>

                  {dayEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Nenhum evento para este dia.
                      </p>
                      <Button onClick={handleCreateEvent}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Evento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayEvents
                        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                        .map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                          />
                        ))}
                    </div>
                  )}
                </>
              )}

              {showForm && selectedDateStr && (
                <EventForm
                  selectedDate={selectedDateStr}
                  event={editingEvent}
                  onSubmit={handleSubmitEvent}
                  onCancel={handleCancel}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}