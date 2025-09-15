import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

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

export function useEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
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

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<AgendaEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...event,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgendaEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento atualizado',
        description: 'O evento foi atualizado com sucesso!',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento excluído',
        description: 'O evento foi excluído com sucesso.',
      });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('event_participants')
        .insert([{
          event_id: eventId,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

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
  };
}