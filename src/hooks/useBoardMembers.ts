import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
    cargo: string | null;
  };
}

export function useBoardMembers(boardId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to fetch board members with profile information
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['board-members', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_members')
        .select(`
          id,
          board_id,
          user_id,
          role,
          created_at,
          profile:user_id (
            id,
            full_name,
            display_name,
            email,
            avatar_url,
            phone,
            cargo
          )
        `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as BoardMember[];
    },
    enabled: !!boardId,
  });

  // Query to fetch the board owner
  const { data: boardOwner } = useQuery({
    queryKey: ['board-owner', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('owner_id')
        .eq('id', boardId)
        .single();

      if (error) throw error;
      return data.owner_id;
    },
    enabled: !!boardId,
  });

  // Mutation to add a member to the board
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('board_members')
        .insert({
          board_id: boardId,
          user_id: userId,
          role: 'member',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });
      toast({
        title: 'Membro adicionado',
        description: 'O membro foi adicionado ao board com sucesso.',
      });
    },
    onError: (error: any) => {
      const msg = String(error.message || '').toLowerCase();
      const isRLSDenied = msg.includes('not authorized') || 
                          msg.includes('violates row level security') || 
                          msg.includes('permission') || 
                          msg.includes('rls') ||
                          msg.includes('duplicate');
      
      toast({
        title: isRLSDenied ? 'Sem permissão' : 'Erro ao adicionar membro',
        description: isRLSDenied
          ? msg.includes('duplicate')
            ? 'Este usuário já é membro deste board.'
            : 'Você não tem permissão para adicionar membros a este board.'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to remove a member from the board
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });
      toast({
        title: 'Membro removido',
        description: 'O membro foi removido do board com sucesso.',
      });
    },
    onError: (error: any) => {
      const msg = String(error.message || '').toLowerCase();
      const isRLSDenied = msg.includes('not authorized') || 
                          msg.includes('violates row level security') || 
                          msg.includes('permission') || 
                          msg.includes('rls');
      
      toast({
        title: isRLSDenied ? 'Sem permissão' : 'Erro ao remover membro',
        description: isRLSDenied
          ? 'Você não tem permissão para remover este membro.'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    members: members || [],
    boardOwner,
    isLoading,
    error,
    addMember: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    isAddingMember: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
  };
}
