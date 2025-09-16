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
      console.log('🚀 [useBoards] Starting to fetch boards...');
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔐 [useBoards] Current user:', user?.id, user?.email);
        
        if (!user) {
          console.log('❌ [useBoards] No authenticated user found');
          throw new Error('User not authenticated');
        }

        // Step 1: Fetch owned boards (simple query, no joins)
        console.log('📋 [useBoards] Fetching owned boards...');
        const { data: ownedBoards, error: ownedError } = await supabase
          .from('boards')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (ownedError) {
          console.error('❌ [useBoards] Error fetching owned boards:', ownedError);
          throw ownedError;
        }

        console.log('✅ [useBoards] Owned boards fetched:', ownedBoards?.length || 0);

        // Step 2: Fetch board_members to get member board IDs
        console.log('👥 [useBoards] Fetching board memberships...');
        const { data: memberships, error: membershipError } = await supabase
          .from('board_members')
          .select('board_id')
          .eq('user_id', user.id);

        if (membershipError) {
          console.error('❌ [useBoards] Error fetching memberships:', membershipError);
          throw membershipError;
        }

        console.log('✅ [useBoards] Memberships fetched:', memberships?.length || 0);

        // Step 3: Fetch member boards by IDs (if any)
        let memberBoards = [];
        if (memberships && memberships.length > 0) {
          const memberBoardIds = memberships.map(m => m.board_id);
          console.log('📋 [useBoards] Fetching member boards by IDs:', memberBoardIds);
          
          const { data: fetchedMemberBoards, error: memberBoardError } = await supabase
            .from('boards')
            .select('*')
            .in('id', memberBoardIds)
            .order('created_at', { ascending: false });

          if (memberBoardError) {
            console.error('❌ [useBoards] Error fetching member boards:', memberBoardError);
            throw memberBoardError;
          }

          memberBoards = fetchedMemberBoards || [];
          console.log('✅ [useBoards] Member boards fetched:', memberBoards.length);
        }

        // Step 4: Combine all boards and remove duplicates
        const allBoardsMap = new Map();
        
        // Add owned boards
        (ownedBoards || []).forEach(board => {
          allBoardsMap.set(board.id, board);
        });
        
        // Add member boards (will not override owned boards due to Map)
        memberBoards.forEach(board => {
          if (!allBoardsMap.has(board.id)) {
            allBoardsMap.set(board.id, board);
          }
        });

        const finalBoards = Array.from(allBoardsMap.values());
        console.log('📊 [useBoards] Total unique boards found:', finalBoards.length);
        console.log('🎯 [useBoards] Final boards:', finalBoards.map(b => ({ id: b.id, title: b.title })));

        return finalBoards;
      } catch (error) {
        console.error('💥 [useBoards] Fatal error in queryFn:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      console.log(`🔄 [useBoards] Retry attempt ${failureCount} for error:`, error instanceof Error ? error.message : String(error));
      return failureCount < 2; // Only retry twice
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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