import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { usePautasStore } from '@/state/pautasStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Tipo mínimo para evitar profundidade excessiva em generics
type EventMinimal = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
};

// Linha mínima retornada na criação de evento para vincular à pauta
type EventRowInserted = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  created_by: string;
};

export function useEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Usa cliente Supabase sem tipo de Database para reduzir profundidade de inferência
  const sb = supabase as SupabaseClient;
  const isOnline = useOnlineStatus();

  const eventsQuery = useQuery<AgendaEvent[], Error>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await sb
        .from('events')
        .select(`
          *,
          creator:profiles!events_created_by_fkey(
            id,
            full_name,
            email
          ),
          participants:event_participants(
            user_id,
            response,
            user:profiles(
              id,
              full_name,
              email
            )
          )
        `)
        .order('start_date', { ascending: true });

      if (error) {
        // Fallback: se RLS impedir joins, busca eventos sem relações
        const { data: plainData, error: plainErr } = await sb
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });
        if (plainErr) throw plainErr;
        return plainData || [];
      }
      return data || [];
    },
    enabled: !!user && isOnline,
  });

  const createEventMutation = useMutation<EventRowInserted, Error, Omit<AgendaEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>>({
    mutationFn: async (event) => {
      if (!isOnline) throw new Error('Sem conexão. Tente novamente quando estiver online.');
      if (!user) throw new Error('User not authenticated');

      const { data: inserted, error } = await sb
        .from('events')
        .insert([
          {
            ...event,
            // Força created_by = auth.uid() para satisfazer a política WITH CHECK
            created_by: user.id,
          },
        ])
        .select('id, title, description, start_date, end_date, location, created_by')
        .single();

      if (error) throw error;
      return inserted as EventRowInserted;
    },
    onSuccess: async (inserted, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso!',
      });

      // Cria automaticamente uma pauta com os mesmos dados do evento
      try {
        if (!user) throw new Error('User not authenticated');
        const titulo = inserted?.title ?? variables?.title ?? 'Evento';
        const descricao = inserted?.description ?? variables?.description ?? '';
        const data_inicio = inserted?.start_date ?? variables?.start_date ?? new Date().toISOString();
        const data_fim = inserted?.end_date ?? variables?.end_date ?? new Date().toISOString();
        const local = inserted?.location ?? variables?.location ?? undefined;
        const insertedEventId: string | null = inserted?.id ?? null;

        let pautaError: unknown = null;
        try {
          const { error } = await sb
            .from('pautas_events')
            .insert([
              {
                titulo,
                descricao,
                data_inicio,
                data_fim,
                tipo: 'evento',
                prioridade: 'media',
                status: 'pendente',
                recorrencia: 'nenhuma',
                cor: '#6366f1',
                local,
                criado_por: user.id,
                source_event_id: insertedEventId ?? null,
              },
            ]);
          pautaError = error;
        } catch (e) {
          pautaError = e;
        }
        // Fallback: se coluna source_event_id não existir, tenta inserir sem o vínculo
        const pautaMsg = typeof pautaError === 'object' && pautaError !== null && 'message' in pautaError
          ? String((pautaError as { message: unknown }).message)
          : String(pautaError);
        if (pautaError && pautaMsg.includes('source_event_id')) {
          const { error: fallbackErr } = await sb
            .from('pautas_events')
            .insert([
              {
                titulo,
                descricao,
                data_inicio,
                data_fim,
                tipo: 'evento',
                prioridade: 'media',
                status: 'pendente',
                recorrencia: 'nenhuma',
                cor: '#6366f1',
                local,
                criado_por: user.id,
              },
            ]);
          pautaError = fallbackErr;
        }
        if (pautaError) throw pautaError;

        // Invalida também cache de pautas, se utilizado
        queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
        toast({
          title: 'Pauta criada',
          description: 'A pauta correspondente foi criada automaticamente.',
        });

        // Adiciona também ao store local de Pautas para aparecer na Agenda Semanal
        const adicionarEvento = usePautasStore.getState().adicionarEvento;
        adicionarEvento({
          titulo,
          descricao,
          dataInicio: new Date(data_inicio),
          dataFim: new Date(data_fim),
          tipo: 'evento',
          prioridade: 'media',
          status: 'agendado',
          responsavel: user.email || user.id,
          participantes: [],
          local,
          observacoes: '',
          recorrencia: 'nenhuma',
          lembrete: 15,
          tags: [],
          anexos: [],
          cor: '#6366f1',
        });
      } catch (err: unknown) {
        const msg = typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Verifique sua conexão ou permissões.';
        toast({
          title: 'Não foi possível criar a pauta automaticamente',
          description: msg,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEventMutation = useMutation<EventMinimal, Error, { id: string } & Partial<EventMinimal>>({
    mutationFn: async ({ id, ...updates }) => {
      if (!isOnline) throw new Error('Sem conexão. Tente novamente quando estiver online.');
      const { data, error } = await sb
        .from('events')
        .update(updates)
        .eq('id', id)
        .select('id, title, description, start_date, end_date, location')
        .single();

      if (error) throw error;
      return data as EventMinimal;
    },
    onSuccess: async (updated: EventMinimal) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento atualizado',
        description: 'O evento foi atualizado com sucesso!',
      });

      // Propaga atualização para pauta vinculada
      try {
        if (!updated?.id) return;
        const id = updated.id;
        type UpdatePayload = {
          titulo?: string;
          descricao?: string | null;
          data_inicio?: string;
          data_fim?: string;
          local?: string | null;
        };
        const updatePayload: UpdatePayload = {
          titulo: updated.title,
          descricao: updated.description ?? null,
          data_inicio: updated.start_date,
          data_fim: updated.end_date,
          local: updated.location ?? null,
        };
        await sb
          .from('pautas_events')
          .update(updatePayload)
          .eq('source_event_id', id);
        queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
      } catch (_e) {
        // Silencia erro de sincronização, não bloqueia atualização da Agenda
      }
    },
  });

  type EventRowForDelete = {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string | null;
    created_by: string;
  };

  const deleteEventMutation = useMutation<EventRowForDelete | null, Error, string>({
    mutationFn: async (id) => {
      if (!isOnline) throw new Error('Sem conexão. Tente novamente quando estiver online.');
      // Busca dados do evento antes de excluir, para fallback na remoção em pautas
      let eventRow: EventRowForDelete | null = null;
      try {
        const { data: ev, error: evErr } = await sb
          .from('events')
          .select('id, title, start_date, end_date, location, created_by')
          .eq('id', id)
          .single();
        if (!evErr && ev) {
          eventRow = ev as EventRowForDelete;
        }
      } catch (_e) {
        // ignora
      }
      const { error } = await sb
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return eventRow;
    },
    onSuccess: async (eventRow, id) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento excluído',
        description: 'O evento foi excluído com sucesso.',
      });

      // Remove pauta vinculada
      try {
        const { error: delErr } = await sb
          .from('pautas_events')
          .delete()
          .eq('source_event_id', id);
        // Fallback: se não houver vínculo explícito, tenta por título/data/criador
        if (delErr && eventRow) {
          await sb
            .from('pautas_events')
            .delete()
            .eq('titulo', eventRow.title)
            .eq('data_inicio', eventRow.start_date)
            .eq('criado_por', eventRow.created_by);
        }
        queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
      } catch (_e) {
        // Silencia erro
      }
    },
  });

  const addParticipantMutation = useMutation<unknown, Error, { eventId: string; userId: string }>({
    mutationFn: async ({ eventId, userId }) => {
      if (!isOnline) throw new Error('Sem conexão. Tente novamente quando estiver online.');
      const { data, error } = await sb
        .from('event_participants')
        .insert([{ 
          event_id: eventId,
          user_id: userId,
        }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // Função para sincronizar todos os eventos do usuário para pautas (backfill)
  const syncAgendaToPautas = async () => {
    if (!isOnline) throw new Error('Sem conexão. Tente novamente quando estiver online.');
    if (!user) throw new Error('User not authenticated');
    // Busca todos os eventos acessíveis ao usuário pela RLS (criados ou convidados)
    const { data: myEvents, error: evErr } = await sb
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
    if (evErr) throw evErr;

    for (const ev of myEvents || []) {
      try {
        const { data: existing, error: checkErr } = await sb
          .from('pautas_events')
          .select('id')
          .eq('source_event_id', ev.id)
          .limit(1);
        if (checkErr) throw checkErr;
        if (Array.isArray(existing) && existing.length > 0) {
          continue; // já sincronizado
        }

        const { error: insErr } = await sb
          .from('pautas_events')
          .insert([
            {
              titulo: ev.title,
              descricao: ev.description,
              data_inicio: ev.start_date,
              data_fim: ev.end_date,
              tipo: 'evento',
              prioridade: 'media',
              status: 'pendente',
              recorrencia: 'nenhuma',
              cor: '#6366f1',
              local: ev.location,
              criado_por: user.id,
              source_event_id: ev.id,
            },
          ]);
        if (insErr) throw insErr;
      } catch (_e) {
        // Silencia por evento, segue com próximos
      }
    }
    queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
    toast({
      title: 'Sincronização concluída',
      description: 'Todos os eventos visíveis na Agenda foram replicados nas Pautas.',
    });
  };

  return {
    events: eventsQuery.data || [],
    loading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    addParticipant: addParticipantMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    syncAgendaToPautas,
  };
}