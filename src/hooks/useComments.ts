import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Tables, TablesInsert } from '../integrations/supabase/types';
import { toast } from 'sonner';
import { useOnlineStatus } from './useOnlineStatus';

export type CardComment = Tables<'card_comments'> & {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export const useComments = (cardId: string) => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  // Buscar comentários do card
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', cardId],
    enabled: !!cardId && isOnline,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('card_id', cardId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar comentários:', error);
        throw error;
      }

      return data as CardComment[];
    },
    // 'enabled' já configurado acima; remover duplicidade evita warning de build
  });

  // Adicionar comentário
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const commentData: TablesInsert<'card_comments'> = {
        card_id: cardId,
        user_id: user.id,
        content,
      };

      const { data, error } = await supabase
        .from('card_comments')
        .insert(commentData)
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao adicionar comentário:', error);
        throw error;
      }

      return data as CardComment;
    },
    onSuccess: (newComment) => {
      // Atualizar cache local
      queryClient.setQueryData(['comments', cardId], (oldComments: CardComment[] = []) => [
        ...oldComments,
        newComment,
      ]);
      
      toast.success('Comentário adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    },
  });

  // Deletar comentário
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      const { error } = await supabase
        .from('card_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Erro ao deletar comentário:', error);
        throw error;
      }

      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      // Atualizar cache local
      queryClient.setQueryData(['comments', cardId], (oldComments: CardComment[] = []) =>
        oldComments.filter(comment => comment.id !== deletedCommentId)
      );
      
      toast.success('Comentário removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar comentário:', error);
      toast.error('Erro ao remover comentário');
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};