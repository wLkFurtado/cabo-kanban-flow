import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Settings, Download, Upload, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { WeeklyAgenda } from './WeeklyAgenda';
import { EventModal } from './EventModal';
import { usePautasStore } from '../../state/pautasStore';
import { useAuthStore } from '../../state/authStore';
import { Evento } from '../../state/pautasTypes';
import { cn } from '../../lib/utils';

export const Pautas: React.FC = () => {
  const { 
    eventos, 
    filtros, 
    setFiltros,
    calcularMetricas,
    obterEventosDoUsuario 
  } = usePautasStore();
  
  const { getCurrentUser } = useAuthStore();
  const currentUser = getCurrentUser();
  
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | undefined>();
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | undefined>();
  const [eventModalInitialHour, setEventModalInitialHour] = useState<number | undefined>();

  const [activeTab, setActiveTab] = useState('agenda');

  // Filtrar eventos do usuário logado
  const eventosDoUsuario = useMemo(() => {
    if (!currentUser) return [];
    return obterEventosDoUsuario(currentUser.email);
  }, [currentUser, obterEventosDoUsuario]);

  // Calcular métricas quando componente monta
  useEffect(() => {
    calcularMetricas();
  }, [eventos, calcularMetricas]);



  const handleCreateEvent = (date?: Date, hour?: number) => {
    setSelectedEvent(undefined);
    setEventModalInitialDate(date);
    setEventModalInitialHour(hour);
    setEventModalOpen(true);
  };

  const handleEditEvent = (eventId: string) => {
    const evento = eventos.find(e => e.id === eventId);
    if (evento) {
      setSelectedEvent(evento);
      setEventModalInitialDate(undefined);
      setEventModalInitialHour(undefined);
      setEventModalOpen(true);
    }
  };



  const exportData = () => {
    const data = {
      eventos,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pautas-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Sistema de Pautas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie escalas e eventos da equipe
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            

            
            <Button
              onClick={() => handleCreateEvent()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="agenda" className="h-full m-0 p-4">
                <WeeklyAgenda
                  eventos={eventosDoUsuario}
                  onEventClick={handleEditEvent}
                  onCreateEvent={handleCreateEvent}
                />
              </TabsContent>
              
              <TabsContent value="eventos" className="h-full m-0 p-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Lista de Eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {eventosDoUsuario.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <p>Nenhum evento encontrado para você</p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => handleCreateEvent()}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeiro Evento
                          </Button>
                        </div>
                      ) : (
                        eventosDoUsuario.map(evento => (
                          <div
                            key={evento.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => handleEditEvent(evento.id)}
                            style={{ borderLeftColor: evento.cor, borderLeftWidth: '4px' }}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {evento.titulo}
                              </h3>
                              <span className={cn(
                                'px-2 py-1 text-xs rounded-full',
                                evento.status === 'agendado' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                                evento.status === 'em_andamento' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                                evento.status === 'concluido' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                                evento.status === 'cancelado' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              )}>
                                {evento.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {evento.descricao}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{evento.tipo}</span>
                              <span>{evento.prioridade}</span>
                              <span>
                                {evento.dataInicio instanceof Date 
                                  ? `${evento.dataInicio.toLocaleDateString('pt-BR')} às ${evento.dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                                  : new Date(evento.dataInicio).toLocaleDateString('pt-BR') + ' às ' + new Date(evento.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                }
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dashboard" className="h-full m-0 p-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Dashboard em desenvolvimento</p>
                      <p className="text-sm mt-2">
                        Aqui serão exibidas métricas e relatórios do sistema
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Modal de evento */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        evento={selectedEvent}
        initialDate={eventModalInitialDate}
        initialHour={eventModalInitialHour}
      />
    </div>
  );
};