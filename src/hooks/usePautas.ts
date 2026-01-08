import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface PautasEvent {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'reuniao' | 'tarefa' | 'escala' | 'evento';
  prioridade: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  recorrencia: 'nenhuma' | 'diaria' | 'semanal' | 'mensal';
  cor: string;
  local?: string;
  responsavel_id?: string;
  filmmaker_id?: string;
  fotografo_id?: string;
  jornalista_id?: string;
  rede_id?: string;
  criado_por: string;
  created_at: string;
  updated_at: string;
}

export function usePautas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['pautas-events'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pautas_events')
        .select(`
          *,
          responsavel:profiles!pautas_events_responsavel_id_fkey(
            id,
            full_name,
            email
          ),
          criador:profiles!pautas_events_criado_por_fkey(
            id,
            full_name,
            email
          )
        `)
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<PautasEvent, 'id' | 'criado_por' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pautas_events')
        .insert([{
          ...event,
          criado_por: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PautasEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('pautas_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
      toast({
        title: 'Evento atualizado',
        description: 'O evento foi atualizado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pautas_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
      toast({
        title: 'Evento excluído',
        description: 'O evento foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const duplicateEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data: originalEvent, error: fetchError } = await supabase
        .from('pautas_events')
        .select('id, titulo, descricao, data_inicio, data_fim, tipo, prioridade, status, recorrencia, cor, local, responsavel_id, criado_por, created_at, updated_at')
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      const { id, created_at, updated_at, ...eventData } = originalEvent;
      
      const { data, error } = await supabase
        .from('pautas_events')
        .insert([{
          ...eventData,
          titulo: `${eventData.titulo} (Cópia)`,
          criado_por: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas-events'] });
      toast({
        title: 'Evento duplicado',
        description: 'O evento foi duplicado com sucesso!',
      });
    },
  });

  // Filter and utility functions
  const getEventsByPeriod = (startDate: Date, endDate: Date) => {
    if (!eventsQuery.data) return [];
    
    return eventsQuery.data.filter(event => {
      const eventStart = new Date(event.data_inicio);
      const eventEnd = new Date(event.data_fim);
      
      return (
        (eventStart >= startDate && eventStart <= endDate) ||
        (eventEnd >= startDate && eventEnd <= endDate) ||
        (eventStart <= startDate && eventEnd >= endDate)
      );
    });
  };

  const getEventsByUser = (userId: string) => {
    if (!eventsQuery.data) return [];
    
    return eventsQuery.data.filter(event => 
      event.criado_por === userId || event.responsavel_id === userId
    );
  };

  const getMetricas = () => {
    if (!eventsQuery.data) return {
      total: 0,
      concluidos: 0,
      pendentes: 0,
      em_andamento: 0,
      cancelados: 0,
    };

    const events = eventsQuery.data;
    
    return {
      total: events.length,
      concluidos: events.filter(e => e.status === 'concluido').length,
      pendentes: events.filter(e => e.status === 'pendente').length,
      em_andamento: events.filter(e => e.status === 'em_andamento').length,
      cancelados: events.filter(e => e.status === 'cancelado').length,
    };
  };

  return {
    events: eventsQuery.data || [],
    loading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    duplicateEvent: duplicateEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    isDuplicating: duplicateEventMutation.isPending,
    getEventsByPeriod,
    getEventsByUser,
    getMetricas,
  };
}