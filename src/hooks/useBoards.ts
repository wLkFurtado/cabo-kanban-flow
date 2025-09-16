import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Board {
  id: string;
  title: string;
  description?: string;
  visibility: 'private' | 'team' | 'public';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface BoardList {
  id: string;
  board_id: string;
  title: string;
  position: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  completed: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useBoards() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Primeiro buscar os boards que o usuário possui
      const { data: ownedBoards, error: ownedError } = await supabase
        .from('boards')
        .select('*')
        .eq('owner_id', session.user.id);

      if (ownedError) {
        throw ownedError;
      }

      // Depois buscar os boards onde o usuário é membro
      const { data: memberBoards, error: memberError } = await supabase
        .from('board_members')
        .select(`
          board_id,
          role,
          boards (*)
        `)
        .eq('user_id', session.user.id);

      if (memberError) {
        throw memberError;
      }

      // Combinar os resultados
      const allBoards = [
        ...(ownedBoards || []),
        ...(memberBoards?.map(mb => mb.boards).filter(Boolean) || [])
      ];

      // Remover duplicatas
      const uniqueBoards = allBoards.filter((board, index, self) => 
        index === self.findIndex(b => b.id === board.id)
      );

      return uniqueBoards;
    },
  });

  const createBoardMutation = useMutation({
    mutationFn: async (board: { title: string; description?: string; visibility?: 'private' | 'team' | 'public' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('boards')
        .insert([{
          ...board,
          owner_id: session.user.id,
          visibility: board.visibility || 'private'
        }])
        .select()
        .single();

      if (error) throw error;

      // Create default lists
      const defaultLists = [
        { title: 'A Fazer', position: 0, color: '#ef4444' },
        { title: 'Em Progresso', position: 1, color: '#f59e0b' },
        { title: 'Concluído', position: 2, color: '#10b981' },
      ];

      await Promise.all(
        defaultLists.map(list => 
          supabase
            .from('board_lists')
            .insert({ ...list, board_id: data.id })
        )
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast({
        title: 'Board criado',
        description: 'Seu novo board foi criado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar board',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Board> & { id: string }) => {
      const { data, error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast({
        title: 'Board excluído',
        description: 'O board foi excluído com sucesso.',
      });
    },
  });

  const createBoard = async (board: { title: string; description?: string; visibility?: 'private' | 'team' | 'public' }) => {
    return new Promise<Board>((resolve, reject) => {
      createBoardMutation.mutate(board, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error)
      });
    });
  };

  return {
    boards: boards || [],
    loading: isLoading,
    error: error,
    createBoard,
    updateBoard: updateBoardMutation.mutate,
    deleteBoard: deleteBoardMutation.mutate,
    isCreating: createBoardMutation.isPending,
    isUpdating: updateBoardMutation.isPending,
    isDeleting: deleteBoardMutation.isPending,
  };
}

export function useBoardDetails(boardId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log('useBoardDetails called with:', { boardId, user: user?.id });

  const boardQuery = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      console.log('Fetching board:', boardId);
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (error) {
        console.error('Board query error:', error);
        throw error;
      }
      console.log('Board data:', data);
      return data;
    },
    enabled: !!user && !!boardId,
  });

  const listsQuery = useQuery({
    queryKey: ['board-lists', boardId],
    queryFn: async () => {
      console.log('Fetching lists for board:', boardId);
      const { data, error } = await supabase
        .from('board_lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (error) {
        console.error('Lists query error:', error);
        throw error;
      }
      console.log('Lists data:', data);
      return data;
    },
    enabled: !!user && !!boardId,
  });

  const cardsQuery = useQuery({
    queryKey: ['board-cards', boardId],
    queryFn: async () => {
      console.log('Fetching cards for board:', boardId);
      // First get all list IDs for this board
      const { data: boardLists, error: listsError } = await supabase
        .from('board_lists')
        .select('id')
        .eq('board_id', boardId);

      if (listsError) {
        console.error('Board lists error:', listsError);
        throw listsError;
      }
      
      console.log('Board lists for cards:', boardLists);
      
      if (!boardLists || boardLists.length === 0) {
        console.log('No lists found, returning empty cards array');
        return [];
      }

      const listIds = boardLists.map(list => list.id);
      console.log('List IDs:', listIds);

      // Then get cards for those lists
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .in('list_id', listIds)
        .order('position');

      if (error) {
        console.error('Cards query error:', error);
        throw error;
      }
      console.log('Cards data:', data);
      return data;
    },
    enabled: !!user && !!boardId,
  });

  const addListMutation = useMutation({
    mutationFn: async (title: string) => {
      const maxPosition = Math.max(...(listsQuery.data?.map(l => l.position) || []), -1);
      
      const { data, error } = await supabase
        .from('board_lists')
        .insert([{
          board_id: boardId,
          title,
          position: maxPosition + 1,
          color: '#6366f1'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-lists', boardId] });
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async ({ listId, title }: { listId: string; title: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const existingCards = cardsQuery.data?.filter(c => c.list_id === listId) || [];
      const maxPosition = Math.max(...existingCards.map(c => c.position), -1);

      const { data, error } = await supabase
        .from('cards')
        .insert([{
          list_id: listId,
          title,
          position: maxPosition + 1,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });
    },
  });

  return {
    board: boardQuery.data,
    lists: listsQuery.data || [],
    cards: cardsQuery.data || [],
    isLoading: boardQuery.isLoading || listsQuery.isLoading || cardsQuery.isLoading,
    error: boardQuery.error || listsQuery.error || cardsQuery.error,
    addList: addListMutation.mutate,
    addCard: addCardMutation.mutate,
    isAddingList: addListMutation.isPending,
    isAddingCard: addCardMutation.isPending,
  };
}