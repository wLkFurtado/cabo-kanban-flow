import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BoardLabel } from '@/state/kanbanTypes';
import { toast } from 'sonner';

// Fetch all labels for a specific board
export function useBoardLabels(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board-labels', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      
      const { data, error } = await supabase
        .from('board_labels')
        .select('*')
        .eq('board_id', boardId)
        .order('name');

      if (error) {
        console.error('Error fetching board labels:', error);
        throw error;
      }

      return (data || []) as BoardLabel[];
    },
    enabled: !!boardId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create a new board label
export function useCreateBoardLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      name,
      color,
    }: {
      boardId: string;
      name: string;
      color: string;
    }) => {
      const { data, error } = await supabase
        .from('board_labels')
        .insert({
          board_id: boardId,
          name,
          color,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BoardLabel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-labels', data.board_id] });
      toast.success('Etiqueta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating board label:', error);
      toast.error('Erro ao criar etiqueta');
    },
  });
}

// Update an existing board label
export function useUpdateBoardLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      boardId,
      name,
      color,
    }: {
      id: string;
      boardId: string;
      name?: string;
      color?: string;
    }) => {
      const updates: Partial<BoardLabel> = {};
      if (name !== undefined) updates.name = name;
      if (color !== undefined) updates.color = color;

      const { data, error } = await supabase
        .from('board_labels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as BoardLabel, boardId };
    },
    onSuccess: ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board-labels', boardId] });
      // Also invalidate cards query to reflect label changes on cards
      queryClient.invalidateQueries({ queryKey: ['board-cards'] });
      toast.success('Etiqueta atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating board label:', error);
      toast.error('Erro ao atualizar etiqueta');
    },
  });
}

// Delete a board label
export function useDeleteBoardLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      const { error } = await supabase
        .from('board_labels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, boardId };
    },
    onSuccess: ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board-labels', boardId] });
      // Also invalidate cards query as card labels might reference this board label
      queryClient.invalidateQueries({ queryKey: ['board-cards'] });
      toast.success('Etiqueta excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting board label:', error);
      toast.error('Erro ao excluir etiqueta');
    },
  });
}
