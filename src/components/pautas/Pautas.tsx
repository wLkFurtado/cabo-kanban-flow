import React, { useState, useMemo, useEffect, useRef } from 'react';
// Removidos: imports de Card e Tabs, não são mais necessários
import { WeeklyAgenda } from './WeeklyAgenda';
import { EventModal } from './EventModal';
// Removido: useAuthStore - usar apenas useAuth para autenticação segura
import { Evento } from '../../state/pautasTypes';
import { usePautas } from '@/hooks/usePautas';
import type { PautasEvent } from '@/hooks/usePautas';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
// Removido: import de utilitário não utilizado após retirar abas

export const Pautas: React.FC = () => {
  const { events, getEventsByUser } = usePautas();
  // Usando apenas useAuth para autenticação segura (removido authStore)
  const { user } = useAuth();
  const { syncAgendaToPautas } = useEvents();
  const didSyncRef = useRef(false);
  // Dispara backfill automático: tudo que está na Agenda deve existir nas Pautas
  useEffect(() => {
    if (user && !didSyncRef.current) {
      didSyncRef.current = true;
      // Executa em segundo plano; erros são silenciosos para não travar UI
      syncAgendaToPautas().catch(() => {});
    }
  }, [user, syncAgendaToPautas]);
  
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | undefined>();

  // Removido: estado de aba ativa, não utilizamos mais Tabs

  // Mapeia eventos do Supabase (pautas_events) para o tipo local "Evento" usado na WeeklyAgenda
  const mapStatus = (status: string): Evento['status'] => {
    switch (status) {
      case 'pendente':
        return 'agendado';
      case 'em_andamento':
        return 'em_andamento';
      case 'concluido':
        return 'concluido';
      case 'cancelado':
        return 'cancelado';
      default:
        return 'agendado';
    }
  };

  const mapToEvento = (e: PautasEvent): Evento => ({
    id: e.id,
    titulo: e.titulo || 'Evento',
    descricao: e.descricao || '',
    dataInicio: new Date(e.data_inicio),
    dataFim: new Date(e.data_fim),
    tipo: (e.tipo || 'evento') as Evento['tipo'],
    prioridade: (e.prioridade || 'media') as Evento['prioridade'],
    status: mapStatus(e.status || 'pendente'),
    responsavel: e.responsavel_id || '',
    participantes: [],
    local: e.local || '',
    observacoes: '',
    filmmaker: '',
    fotografo: '',
    rede: '',
    recorrencia: (e.recorrencia || 'nenhuma') as Evento['recorrencia'],
    lembrete: 15,
    tags: [],
    anexos: [],
    cor: e.cor || '#3b82f6'
  });

  const eventosSupabase = useMemo(() => {
    return (events || []).map(mapToEvento);
  }, [events, mapToEvento]);

  // Filtrar eventos do usuário logado
  const effectiveUserId = user?.id;
  const eventosDoUsuario = useMemo(() => {
    if (!effectiveUserId) return [];
    const list = getEventsByUser(effectiveUserId) || [];
    return list.map(mapToEvento);
  }, [effectiveUserId, getEventsByUser, events, mapToEvento]);

  // Exibe todos os eventos das Pautas para qualquer usuário autenticado
  const eventosParaAgenda = useMemo(() => {
    return eventosSupabase;
  }, [eventosSupabase]);

  // Métricas locais removidas; fonte de dados agora é o Supabase



  const handleEditEvent = (eventId: string) => {
    const evento = eventosParaAgenda.find(e => e.id === eventId);
    if (evento) {
      setSelectedEvent(evento);
      setEventModalOpen(true);
    }
  };



  // Removidos: exportação e criação de eventos diretamente em Pautas

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

        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área principal */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <WeeklyAgenda
            eventos={eventosParaAgenda}
            onEventClick={handleEditEvent}
          />
        </div>
      </div>
      
      {/* Modal de evento */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        evento={selectedEvent}
      />
    </div>
  );
};