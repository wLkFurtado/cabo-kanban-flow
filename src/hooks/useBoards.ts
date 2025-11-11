import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuth } from './useAuth';
import { useAdminRole } from './useAdminRole';
import { useToast } from '../components/ui/use-toast';
import { useBoardsStore } from '../state/boards/store';
import { SupabaseClient } from '@supabase/supabase-js';
import { postWebhook } from '../lib/webhook';

// Cliente leve para operações fora do escopo do tipo Database
const sb = supabase as SupabaseClient;

export interface Board {
  id: string;
  title: string;
  description?: string;
  visibility: 'private' | 'team' | 'public';
  owner_id: string;
  created_at: string;
  updated_at: string;
  cover_image_url?: string;
  cover_color?: string;
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  cover_color?: string;
  cover_images?: string[];
}
// Tipos auxiliares para linhas do Supabase com campos possivelmente nulos
type BoardRowExtras = {
  description?: string | null;
  cover_image_url?: string | null;
  cover_color?: string | null;
};

type BoardListRow = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  color: string | null;
  created_at: string;
  updated_at: string;
};

type CardRow = {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date: string | null;
  completed: boolean | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  cover_color: string | null;
  cover_images: string[] | null;
};

export interface CardUpdateData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  dueDate?: string;
  coverColor?: string;
  coverImages?: string[];
}

export function useBoards() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const isOnline = useOnlineStatus();

  const { data: boards, isLoading, error } = useQuery(
    ['boards', user?.id, isAdmin ? 'admin' : 'user'] as const,
    async () => {
      const currentUserId = user?.id;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      // Admins: fetch all boards directly (RLS allows)
      if (isAdmin) {
        console.log('🔍 [DEBUG] Admin detected. Fetching ALL boards');
        const { data, error } = await supabase
          .from('boards')
          .select('id, title, description, created_at, owner_id, visibility')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('❌ [DEBUG] Error fetching all boards for admin:', error);
          throw error;
        }
        const normalizedAdmin = ((data || []) as (Board & BoardRowExtras)[]).map((row) => ({
          ...row,
          description: (row as BoardRowExtras).description ?? undefined,
          cover_image_url: (row as BoardRowExtras).cover_image_url ?? undefined,
          cover_color: (row as BoardRowExtras).cover_color ?? undefined,
        })) as Board[];
        return normalizedAdmin;
      }

      // Non-admins: fetch owned boards and boards where user is a member, then merge uniquely
      console.log('🔍 [DEBUG] Fetching owned boards for user:', currentUserId);
      const ownedResult = await supabase
        .from('boards')
        .select('id, title, description, created_at, owner_id, visibility')
        .eq('owner_id', currentUserId)
        .order('created_at', { ascending: false });

      if (ownedResult.error) {
        console.error('❌ [DEBUG] Error fetching owned boards:', ownedResult.error);
        throw ownedResult.error;
      }

      const ownedBoards = ((ownedResult.data || []) as (Board & BoardRowExtras)[]).map((row) => ({
        ...row,
        description: (row as BoardRowExtras).description ?? undefined,
        cover_image_url: (row as BoardRowExtras).cover_image_url ?? undefined,
        cover_color: (row as BoardRowExtras).cover_color ?? undefined,
      })) as Board[];
      console.log('✅ [DEBUG] Owned boards count:', ownedBoards.length);

      console.log('🔍 [DEBUG] Fetching membership ids for user:', currentUserId);
      const membershipIdsResult = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', currentUserId);

      if (membershipIdsResult.error) {
        console.error('❌ [DEBUG] Error fetching memberships:', membershipIdsResult.error);
        throw membershipIdsResult.error;
      }

      const membershipIds = (membershipIdsResult.data || []).map((m: { board_id: string }) => m.board_id);
      console.log('✅ [DEBUG] Membership board ids count:', membershipIds.length);

      let memberBoards: Board[] = [];
      if (membershipIds.length > 0) {
        console.log('🔍 [DEBUG] Fetching member boards via ids:', membershipIds.length);
        const memberBoardsResult = await supabase
          .from('boards')
          .select('id, title, description, created_at, owner_id, visibility')
          .in('id', membershipIds);

        if (memberBoardsResult.error) {
          console.error('❌ [DEBUG] Error fetching member boards:', memberBoardsResult.error);
          throw memberBoardsResult.error;
        }

        memberBoards = ((memberBoardsResult.data || []) as (Board & BoardRowExtras)[]).map((row) => ({
          ...row,
          description: (row as BoardRowExtras).description ?? undefined,
          cover_image_url: (row as BoardRowExtras).cover_image_url ?? undefined,
          cover_color: (row as BoardRowExtras).cover_color ?? undefined,
        })) as Board[];
      }

      const allBoardsMap = new Map<string, Board>();
      for (const b of ownedBoards) allBoardsMap.set(b.id, b);
      for (const b of memberBoards) allBoardsMap.set(b.id, b);

      const merged = Array.from(allBoardsMap.values())
        .sort((a: Board, b: Board) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ [DEBUG] Merged visible boards count:', merged.length);
      return merged;
    },
    {
      enabled: !!user?.id && !adminLoading && isOnline,
      refetchOnMount: false,
      staleTime: 300000,
      keepPreviousData: true,
      retry: (failureCount, error) => {
        console.log(`🔄 [useBoards] Retry attempt ${failureCount} for error:`, error instanceof Error ? error.message : String(error));
        return failureCount < 2; // Only retry twice
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const createBoardMutation = useMutation({
    mutationFn: async (board: { title: string; description?: string; visibility?: 'private' | 'team' | 'public'; initialStages?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) throw new Error('User not authenticated');

      // Ensure the authenticated user has a corresponding row in public.profiles
      // This avoids foreign key violations when inserting boards and memberships.
      try {
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileFetchError) {
          console.warn('[Boards] Profile fetch error before board creation:', profileFetchError);
        }

        if (!existingProfile) {
          const md = session.user.user_metadata || {};
          const getStr = (k: string) => {
            const v = (md as Record<string, unknown>)[k];
            return typeof v === 'string' ? v : undefined;
          };

          const nameFromGivenFamily = [getStr('given_name') ?? getStr('first_name'), getStr('family_name') ?? getStr('last_name')]
            .filter(Boolean)
            .join(' ')
            .trim();
          const fullName = getStr('full_name') || getStr('name') || nameFromGivenFamily || (session.user.email ? String(session.user.email).split('@')[0] : undefined);

          const { error: profileInsertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email ?? null,
              full_name: fullName ?? null,
              cargo: getStr('cargo') ?? null,
              role: (getStr('role') ?? 'user') as string,
              avatar_url: getStr('avatar_url') ?? null,
              display_name: getStr('display_name') ?? fullName ?? null,
            })
            .select();

          if (profileInsertError) {
            console.warn('[Boards] Profile upsert error before board creation:', profileInsertError);
          }
        }
      } catch (e) {
        console.warn('[Boards] Exception ensuring profile before board creation:', e);
      }

      const boardData = {
        ...board,
        owner_id: session.user.id,
        visibility: board.visibility || 'private'
      };

      try {
        const { data, error } = await supabase
          .from('boards')
          .insert([boardData])
          .select()
          .single();

        let createdBoard = data as (Board & BoardRowExtras) | null;
        let usedRpcFallback = false;
        if (error || !createdBoard) {
          // Fallback via RPC em caso de RLS/FK issues
          console.warn('Tentando fallback RPC create_board_safe devido a erro no insert direto:', error);
          // Chamada RPC com tipagem relaxada para evitar 'never' quando a função não está nos tipos gerados
          const rpcFnName = 'create_board_safe';
          const rpcParams = {
            board_title: boardData.title,
            board_description: board.description || '',
            board_visibility: boardData.visibility,
            board_owner_id: session.user.id,
          } as Record<string, unknown>;
          const rpcRes = await (supabase.rpc as unknown as (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; details?: string; hint?: string } | null }>) (rpcFnName, rpcParams);
          if (rpcRes.error || !rpcRes.data) {
            console.error('Falha no RPC create_board_safe:', rpcRes.error);
            const e = rpcRes.error || error;
            const details = e ? [e.details, e.hint].filter(Boolean).join(' — ') : '';
            throw new Error(e ? (details ? `${e.message} (${details})` : e.message) : 'Falha ao criar board');
          }
          // RPC retorna uma linha
          const r = Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data;
          createdBoard = {
            id: r.id,
            title: r.title,
            description: r.description,
            visibility: r.visibility,
            owner_id: r.owner_id,
            created_at: r.created_at,
            updated_at: r.updated_at,
            cover_image_url: null,
            cover_color: null,
          } as unknown as Board & BoardRowExtras;
          usedRpcFallback = true;
        }

        // Garantir que o criador esteja na lista de membros do board para evitar bloqueios de RLS
        try {
          const { error: memberError } = await supabase
            .from('board_members')
            .insert({ board_id: createdBoard!.id, user_id: session.user.id });
          if (memberError) {
            console.warn('Aviso: falha ao inserir membro do board (criador):', memberError.message);
          }
        } catch (memberEx) {
          console.warn('Aviso: exceção ao inserir membro do board (criador):', memberEx);
        }

        // Create initial lists from provided stages ou ajustar listas do fallback RPC
        const cleanStages = (board.initialStages || [])
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const palette = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316'];
        const listsToCreate = (cleanStages.length > 0 ? cleanStages : ['A fazer','Fazendo','Concluído']).map((title, idx) => ({
          title,
          position: idx,
          color: palette[idx % palette.length],
        }));

        if (usedRpcFallback && cleanStages.length > 0) {
          // O RPC já criou listas padrão; substituí-las pelas desejadas
          try {
            await supabase.from('board_lists').delete().eq('board_id', createdBoard!.id);
          } catch (delErr) {
            console.warn('Falha ao remover listas padrão após RPC:', delErr);
          }
        }

        await Promise.all(
          listsToCreate.map(async (list: { title: string; position: number; color: string }) => {
            const listResult = await supabase
              .from('board_lists')
              .insert({ ...list, board_id: createdBoard!.id });
            if (listResult.error) {
              console.error('Erro ao criar lista:', listResult.error);
            }
          })
        );

        // Normalize Supabase row to local Board type to avoid null/union mismatches
        const normalized: Board = {
          id: createdBoard!.id,
          title: createdBoard!.title,
          description: (createdBoard as BoardRowExtras).description ?? undefined,
          visibility: (createdBoard!.visibility as 'private' | 'team' | 'public') ?? 'private',
          owner_id: createdBoard!.owner_id,
          created_at: createdBoard!.created_at ?? new Date().toISOString(),
          updated_at: createdBoard!.updated_at ?? new Date().toISOString(),
          cover_image_url: (createdBoard as BoardRowExtras).cover_image_url ?? undefined,
          cover_color: (createdBoard as BoardRowExtras).cover_color ?? undefined,
        };

        return normalized;

      } catch (error) {
        console.error('Erro fatal ao criar board:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast({
        title: 'Board criado',
        description: 'Seu novo board foi criado com sucesso!',
      });
    },
    onError: (error: Error) => {
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
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      // Apagar dependências conhecidas antes do board para evitar falhas por FK/RLS
      // Usamos o cliente "sb" (SupabaseClient não tipado) para evitar erros de tipos em tabelas não mapeadas
      // 1) Atividades de cards do board
      const { error: actErr } = await sb
        .from('card_activities')
        .delete()
        .eq('board_id', id);
      if (actErr) {
        console.warn('⚠️ Falha ao apagar card_activities:', actErr);
      }

      // 2) Listas e cards associados
      const { data: lists, error: listsErr } = await sb
        .from('board_lists')
        .select('id')
        .eq('board_id', id);
      if (listsErr) {
        console.warn('⚠️ Falha ao buscar listas antes de exclusão:', listsErr);
      }
      // Mapear IDs sem usar `any`
      const listIds = Array.isArray(lists)
        ? (lists as { id: string }[]).map((l) => String(l.id))
        : [];
      if (listIds.length > 0) {
        // Buscar cards para possível limpeza adicional
        const { data: cards, error: cardsErr } = await sb
          .from('cards')
          .select('id')
          .in('list_id', listIds);
        if (cardsErr) {
          console.warn('⚠️ Falha ao buscar cards antes de exclusão:', cardsErr);
        }
        const cardIds = Array.isArray(cards)
          ? (cards as { id: string }[]).map((c) => String(c.id))
          : [];

        // Apagar labels dos cards (se não houver CASCADE no banco)
        if (cardIds.length > 0) {
          const { error: labelsErr } = await sb
            .from('card_labels')
            .delete()
            .in('card_id', cardIds);
          if (labelsErr) {
            console.warn('⚠️ Falha ao apagar card_labels:', labelsErr);
          }
        }

        // Apagar cards
        const { error: delCardsErr } = await sb
          .from('cards')
          .delete()
          .in('list_id', listIds);
        if (delCardsErr) {
          console.warn('⚠️ Falha ao apagar cards:', delCardsErr);
        }
      }

      // 3) Apagar membership do board
      const { error: membersErr } = await sb
        .from('board_members')
        .delete()
        .eq('board_id', id);
      if (membersErr) {
        console.warn('⚠️ Falha ao apagar board_members:', membersErr);
      }

      // 4) Apagar listas
      const { error: delListsErr } = await sb
        .from('board_lists')
        .delete()
        .eq('board_id', id);
      if (delListsErr) {
        console.warn('⚠️ Falha ao apagar board_lists:', delListsErr);
      }

      // 5) Finalmente apagar o board
      const { error: boardErr } = await sb
        .from('boards')
        .delete()
        .eq('id', id);
      if (boardErr) throw boardErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast({
        title: 'Board excluído',
        description: 'O board foi excluído com sucesso.',
      });
    },
  });

  const createBoard = async (board: { title: string; description?: string; visibility?: 'private' | 'team' | 'public'; initialStages?: string[] }) => {
    return new Promise<Board>((resolve, reject) => {
      createBoardMutation.mutate(board, {
        onSuccess: (data) => resolve(data as Board),
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
    // Expor também a versão assíncrona para permitir await no UI
    deleteBoardAsync: deleteBoardMutation.mutateAsync,
    isCreating: createBoardMutation.isPending,
    isUpdating: updateBoardMutation.isPending,
    isDeleting: deleteBoardMutation.isPending,
  };
}

export function useBoardDetails(boardId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const addActivity = useBoardsStore((s) => s.addActivity);
  const isOnline = useOnlineStatus();

  // Helper para registrar atividade local e no Supabase
  const logActivity = async (cardId: string, type: string, description: string) => {
    try {
      const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || 'Usuário';
      addActivity(boardId, cardId, authorName, type, description);
      await sb.from('card_activities').insert({
        board_id: boardId,
        card_id: cardId,
        user_id: user?.id,
        type,
        description,
      });
      // Atualizar imediatamente atividades do card
      queryClient.invalidateQueries({ queryKey: ['card-activities', cardId] });
    } catch (err) {
      console.warn('⚠️ Falha ao registrar atividade:', err);
    }
  };

  const boardQuery = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        description: (data as BoardRowExtras)?.description ?? undefined,
        cover_image_url: (data as BoardRowExtras)?.cover_image_url ?? undefined,
        cover_color: (data as BoardRowExtras)?.cover_color ?? undefined,
      } as Board;
    },
    enabled: !!user && !!boardId && isOnline,
    staleTime: 60000,
    keepPreviousData: true,
  });

  // Garante que o dono do board tenha membership para evitar bloqueios de RLS nas tabelas filhas
  const ensureMembershipQuery = useQuery({
    queryKey: ['ensure-membership', boardId, user?.id],
    enabled: !!user?.id && !!boardId && isOnline && !!boardQuery.data,
    queryFn: async () => {
      try {
        const currentUserId = user!.id;
        const board = boardQuery.data as Board;
        // Tenta verificar se já existe membership
        const { data: membershipRows, error: membershipErr } = await supabase
          .from('board_members')
          .select('user_id')
          .eq('board_id', boardId)
          .eq('user_id', currentUserId);

        if (!membershipErr && membershipRows && membershipRows.length > 0) {
          return true;
        }

        // Se for o dono, tentar inserir membership para liberar acesso às tabelas filhas
        if (board.owner_id === currentUserId) {
          const { error: insertErr } = await supabase
            .from('board_members')
            .insert({ board_id: boardId, user_id: currentUserId });
          if (insertErr) {
            console.warn('⚠️ Falha ao inserir membership do dono:', insertErr);
            // Mesmo falhando, retornamos true para não travar o carregamento; queries posteriores podem retornar erro visível.
            return true;
          }
          return true;
        }

        // Caso não seja dono, seguimos; se o usuário tiver permissão por RLS, as queries funcionarão
        return true;
      } catch (e) {
        console.warn('⚠️ Erro ao garantir membership:', e);
        return true;
      }
    },
  });

  const listsQuery = useQuery({
    queryKey: ['board-lists', boardId],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('board_lists')
        .select('id, title, position, color')
        .eq('board_id', boardId)
        .order('position');

      if (error) {
        throw error;
      }

      return ((data || []) as BoardListRow[]).map((row: BoardListRow) => ({
        ...row,
        color: row.color ?? '#6366f1',
      })) as BoardList[];
    },
    enabled: !!user && !!boardId && isOnline && !!boardQuery.data,
    staleTime: 60000,
    keepPreviousData: true,
  });

  // Query para buscar cards do board
  const cardsQuery = useQuery({
    queryKey: ['board-cards', boardId],
    queryFn: async () => {
      console.log('🔍 [DEBUG] Buscando cards do board (join por listas):', boardId);

      // Buscar cards diretamente via join com board_lists, filtrando por board_id
      const { data, error } = await supabase
        .from('cards')
        .select(`
          id, list_id, title, position, priority, completed, due_date, description,
          cover_color, cover_images,
          board_lists!inner ( board_id )
        `)
        .eq('board_lists.board_id', boardId)
        .order('position');

      if (error) {
        console.log('❌ [DEBUG] Erro ao buscar cards:', error);
        throw error;
      }

      console.log('📋 [DEBUG] Cards encontrados:', data);
      const rows = (data ?? []) as unknown as Array<{
        id: string;
        list_id: string;
        title: string;
        position: number;
        priority: 'low' | 'medium' | 'high' | 'urgent' | null;
        completed: boolean | null;
        due_date: string | null;
        description: string | null;
        cover_color?: string | null;
        cover_images?: string[] | null;
      }>;

      const normalized = rows.map((row) => ({
        id: row.id,
        list_id: row.list_id,
        title: row.title,
        position: row.position,
        description: row.description ?? undefined,
        due_date: row.due_date ?? undefined,
        completed: !!row.completed,
        priority: (row.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        cover_color: row.cover_color ?? undefined,
        cover_images: row.cover_images ?? [],
      })) as Card[];
      return normalized;
    },
    enabled: !!user && !!boardId && isOnline,
    staleTime: 60000,
    keepPreviousData: true,
  });

  // KISS: adiar dados secundários (labels, comentários e membros) após a renderização básica
  const [enableSecondary, setEnableSecondary] = useState(false);
  useEffect(() => {
    setEnableSecondary(false);
    const t = setTimeout(() => setEnableSecondary(true), 300);
    return () => clearTimeout(t);
  }, [boardId]);

  // Buscar labels dos cards para exibir cores e contagem
  const cardLabelsQuery = useQuery({
    queryKey: ['card-labels', boardId],
    enabled: enableSecondary && !!cardsQuery.data && cardsQuery.data.length > 0 && isOnline,
    retry: false,
    queryFn: async () => {
      const cardIds = (cardsQuery.data || []).map((c) => c.id);
      const { data, error } = await supabase
        .from('card_labels')
        .select('id, card_id, name, color')
        .in('card_id', cardIds);

      if (error) throw error;

      const grouped: Record<string, { id: string; name: string; color: string }[]> = {};
      cardIds.forEach((id) => { grouped[id] = []; });
      (data || []).forEach((row: { id: string; card_id: string; name: string; color: string }) => {
        if (!grouped[row.card_id]) grouped[row.card_id] = [];
        grouped[row.card_id].push({ id: row.id, name: row.name, color: row.color });
      });
      return grouped;
    },
    staleTime: 60000,
    keepPreviousData: true,
  });

  // Buscar comentários para obter contagem por card
  const cardCommentsCountQuery = useQuery({
    queryKey: ['card-comments-count', boardId],
    enabled: enableSecondary && !!cardsQuery.data && cardsQuery.data.length > 0 && isOnline,
    retry: false,
    queryFn: async () => {
      const cardIds = (cardsQuery.data || []).map((c) => c.id);
      const { data, error } = await supabase
        .from('card_comments')
        .select('id, card_id')
        .in('card_id', cardIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      cardIds.forEach((id) => { counts[id] = 0; });
      (data || []).forEach((row) => {
        counts[row.card_id] = (counts[row.card_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 60000,
    keepPreviousData: true,
  });

  // Buscar membros dos cards (apenas usuários cadastrados)
  // Tipagem para resultado da query com join de profiles
  type CardMemberRow = {
    card_id: string;
    user_id: string;
    profiles: {
      full_name?: string | null;
      avatar_url?: string | null;
      phone?: string | null;
      cargo?: string | null;
    } | null;
  };

  const cardMembersQuery = useQuery({
    queryKey: ['card-members', boardId],
    enabled: enableSecondary && !!cardsQuery.data && cardsQuery.data.length > 0 && isOnline,
    retry: false,
    queryFn: async () => {
      const cardIds = (cardsQuery.data || []).map((c) => c.id);
      const { data, error } = await supabase
        .from('card_members')
        .select(`
          card_id,
          user_id,
          profiles:profiles (id, full_name, avatar_url, phone, cargo)
        `)
        .in('card_id', cardIds);

      if (error) throw error;

      const grouped: Record<string, { id: string; name: string; avatar?: string; phone?: string | null; cargo?: string | null }[]> = {};
      cardIds.forEach((id) => { grouped[id] = []; });
      const rows = (data || []) as CardMemberRow[];
      rows.forEach((row) => {
        const name = row.profiles?.full_name || 'Usuário';
        const avatar = row.profiles?.avatar_url || undefined;
        const phone = row.profiles?.phone ?? null;
        const cargo = row.profiles?.cargo ?? null;
        const member = { id: row.user_id, name, avatar, phone, cargo };
        if (!grouped[row.card_id]) grouped[row.card_id] = [];
        grouped[row.card_id].push(member);
      });
      return grouped;
    },
    staleTime: 60000,
    keepPreviousData: true,
  });

  // Helper para montar snapshot completo de card para o webhook
  const buildCardSnapshot = (cardLike: Partial<CardRow> | Partial<Card>) => {
    const cardId = String(cardLike.id);
    const listId = String(cardLike.list_id);
    const list = (listsQuery.data || []).find((l) => String(l.id) === listId);
    const labels = (cardLabelsQuery.data || {})[cardId] || [];
    const members = (cardMembersQuery.data || {})[cardId] || [];

    // Usa interseção de tipos para acessar campos comuns sem recorrer a `any`
    const c = cardLike as Partial<CardRow & Card>;

    return {
      boardId,
      list: {
        id: list?.id || listId,
        title: list?.title || null,
      },
      card: {
        id: cardId,
        title: c.title ?? null,
        description: c.description ?? null,
        priority: c.priority ?? null,
        due_date: c.due_date ?? null,
        completed: Boolean(c.completed ?? false),
        position: c.position ?? null,
        cover_color: c.cover_color ?? null,
        cover_images: c.cover_images ?? null,
      },
      labels,
      members,
    };
  };

  const addListMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
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

  const renameListMutation = useMutation({
    mutationFn: async ({ listId, title }: { listId: string; title: string }) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      const { data, error } = await supabase
        .from('board_lists')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-lists', boardId] });
      toast({ title: 'Lista renomeada', description: 'Título atualizado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao renomear lista', description: error.message, variant: 'destructive' });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      // KISS: remover cards da lista antes para evitar erro de FK
      await supabase.from('cards').delete().eq('list_id', listId);
      const { error } = await supabase
        .from('board_lists')
        .delete()
        .eq('id', listId);
      if (error) throw error;
      return listId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-lists', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });
      toast({ title: 'Lista excluída', description: 'A lista foi removida com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir lista', description: error.message, variant: 'destructive' });
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async ({ listId, title }: { listId: string; title: string }) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
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
    onSuccess: async (card) => {
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });
      if (card?.id) {
        // Vincular automaticamente o criador como membro do card
        try {
          await supabase
            .from('card_members')
            .insert({ card_id: card.id as string, user_id: user?.id as string });
          // Atualizar imediatamente membros
          queryClient.invalidateQueries({ queryKey: ['card-members', boardId] });
        } catch (memberErr) {
          console.warn('⚠️ Falha ao vincular criador como membro do card:', memberErr);
        }

        await logActivity(card.id as string, 'card_created', 'criou este cartão');
        // Webhook: criação de card com TODOS os membros vinculados (nome, telefone, cargo)
        try {
          const { data: memberRows } = await supabase
            .from('card_members')
            .select(`
              card_id,
              user_id,
              profiles:profiles (id, full_name, avatar_url, phone, cargo)
            `)
            .eq('card_id', card.id as string);

          let members = (memberRows ?? []).map(row => ({
            id: row.user_id,
            name: row.profiles?.full_name ?? 'Usuário',
            avatar: row.profiles?.avatar_url ?? undefined,
            phone: row.profiles?.phone ?? null,
            cargo: row.profiles?.cargo ?? null,
          }));

          // Fallback: se não houver membros (ex.: card recém-criado ou RLS), incluir o criador
          if (!members || members.length === 0) {
            const { data: creatorProfile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, phone, cargo')
              .eq('id', user?.id || '')
              .maybeSingle();
            members = [{
              id: user?.id as string,
              name: (creatorProfile?.full_name ?? user?.email ?? 'Usuário') as string,
              avatar: creatorProfile?.avatar_url ?? undefined,
              phone: creatorProfile?.phone ?? null,
              cargo: creatorProfile?.cargo ?? null,
            }];
          }

          await postWebhook({
            event: 'card_created',
            ...buildCardSnapshot(card as CardRow),
            members,
          });
        } catch (whErr) {
          console.warn('[Webhook] erro ao montar lista completa de membros em card_created:', whErr);
          // Fallback: enviar sem lista se algo falhar
          await postWebhook({
            event: 'card_created',
            ...buildCardSnapshot(card as CardRow),
          });
        }
      }
      toast({
        title: 'Card criado',
        description: 'Novo card adicionado à lista.',
      });
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, sourceListId, destinationListId, newPosition }: {
      cardId: string;
      sourceListId: string;
      destinationListId: string;
      newPosition: number;
    }) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      console.log('🔍 [DEBUG] Iniciando moveCardMutation:', { cardId, sourceListId, destinationListId, newPosition });
      
      if (!user) {
        console.log('❌ [DEBUG] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 [DEBUG] Usuário autenticado:', user.id);

      // Buscar o card atual
      console.log('🔍 [DEBUG] Buscando card atual...');
      const { data: currentCard, error: fetchError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (fetchError) {
        console.log('❌ [DEBUG] Erro ao buscar card:', fetchError);
        throw fetchError;
      }
      if (!currentCard) {
        console.log('❌ [DEBUG] Card não encontrado');
        throw new Error('Card não encontrado');
      }

      console.log('📋 [DEBUG] Card encontrado:', currentCard);

      // Atualizar o card com a nova lista e posição
      console.log('💾 [DEBUG] Tentando atualizar card...');
      const updateData = { 
        list_id: destinationListId,
        position: newPosition,
        updated_at: new Date().toISOString()
      };
      console.log('📝 [DEBUG] Dados para update:', updateData);

      const { data: updateResult, error: updateError } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId)
        .select();

      if (updateError) {
        console.log('❌ [DEBUG] Erro no update:', updateError);
        throw updateError;
      }

      console.log('✅ [DEBUG] Update realizado com sucesso:', updateResult);

      // Normalizar posições nas listas afetadas para refletir a ordem desejada
      console.log('🧮 [DEBUG] Normalizando posições nas listas afetadas...');
      if (sourceListId === destinationListId) {
        // Reordenar dentro da mesma lista
        const { data: destCards, error: destErr } = await supabase
          .from('cards')
          .select('id, list_id, position')
          .eq('list_id', destinationListId)
          .order('position', { ascending: true });
        if (destErr) throw destErr;
        const withoutMoved = (destCards || []).filter((c) => c.id !== cardId);
        const movedFull = {
          id: cardId,
          list_id: destinationListId,
          position: newPosition,
        };
        const reordered = withoutMoved.slice();
        reordered.splice(newPosition, 0, movedFull);
        const updates = reordered.map((c, idx) => ({ id: c.id, position: idx }));
        await Promise.all(
          updates.map((u) =>
            supabase
              .from('cards')
              .update({ position: u.position, updated_at: new Date().toISOString() })
              .eq('id', u.id)
          )
        );
      } else {
        // Reindexar origem e destino separadamente
        const [{ data: srcCards, error: srcErr }, { data: destCards, error: destErr }] = await Promise.all([
          supabase
            .from('cards')
            .select('id, list_id, position')
            .eq('list_id', sourceListId)
            .order('position', { ascending: true }),
          supabase
            .from('cards')
            .select('id, list_id, position')
            .eq('list_id', destinationListId)
            .order('position', { ascending: true }),
        ]);
        if (srcErr) throw srcErr;
        if (destErr) throw destErr;

        // Origem: remover movido e compactar
        const srcWithoutMoved = (srcCards || []).filter((c) => c.id !== cardId);
        const srcUpdates = srcWithoutMoved.map((c, idx) => ({ id: c.id, position: idx }));

        // Destino: inserir movido na posição solicitada e reindexar
        const destWithoutMoved = (destCards || []).filter((c) => c.id !== cardId);
        const movedFull = {
          id: cardId,
          list_id: destinationListId,
          position: newPosition,
        };
        const destReordered = destWithoutMoved.slice();
        destReordered.splice(newPosition, 0, movedFull);
        const destUpdates = destReordered.map((c, idx) => ({ id: c.id, position: idx }));

        await Promise.all([
          ...srcUpdates.map((u) =>
            supabase
              .from('cards')
              .update({ position: u.position, updated_at: new Date().toISOString() })
              .eq('id', u.id)
          ),
          ...destUpdates.map((u) =>
            supabase
              .from('cards')
              .update({ position: u.position, updated_at: new Date().toISOString() })
              .eq('id', u.id)
          ),
        ]);
      }

      return { cardId, sourceListId, destinationListId, newPosition };
    },
    onMutate: async ({ cardId, sourceListId, destinationListId, newPosition }) => {
      console.log('🔄 [DEBUG] onMutate iniciado:', { cardId, sourceListId, destinationListId, newPosition });
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board-cards', boardId] });
      
      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>(['board-cards', boardId]);
      console.log('📸 [DEBUG] Snapshot dos cards anteriores:', previousCards);
      
      // Optimistic update
      if (previousCards) {
        const updatedCards = previousCards.map((card) => {
          if (card.id === cardId) {
            return { ...card, list_id: destinationListId, position: newPosition } as Card;
          }
          return card;
        }).map((card) => {
          // Ajustar posições dentro das listas afetadas
          if (card.list_id === sourceListId) {
            // Se veio da lista origem, compactar posições
            return {
              ...card,
              position: card.position > newPosition && sourceListId === destinationListId
                ? card.position - 1
                : card.position,
            };
          }
          return card;
        });

        // Após alterar list_id do card movido, precisamos reordenar posições em ambas listas
        const normalizePositions = (cardsArr: Card[]) =>
          cardsArr
            .sort((a, b) => a.position - b.position)
            .map((c, idx) => ({ ...c, position: idx }));

        const cardsByList: Record<string, Card[]> = {};
        updatedCards.forEach((c) => {
          cardsByList[c.list_id] = cardsByList[c.list_id] || [];
          cardsByList[c.list_id].push(c);
        });
        const recomposed: Card[] = Object.values(cardsByList)
          .flatMap((arr) => normalizePositions(arr));

        queryClient.setQueryData(['board-cards', boardId], recomposed);
      }
      
      return { previousCards };
    },
    onError: (err, variables, context) => {
      console.log('❌ [DEBUG] Erro na mutation:', err);
      console.log('🔄 [DEBUG] Fazendo rollback...');
      
      // Rollback on error
      if (context?.previousCards) {
        queryClient.setQueryData(['board-cards', boardId], context.previousCards);
      }
      
      toast({
        title: 'Erro ao mover card',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
    onSuccess: async (data) => {
      console.log('✅ [DEBUG] Mutation bem-sucedida:', data);
      
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });
      
      // Registrar atividade: card movido para determinada lista
      try {
        const destinationList = (listsQuery.data || []).find((l) => l.id === data.destinationListId);
        const destinationTitle = destinationList?.title || 'Etapa desconhecida';
        const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || 'Usuário';

        // Atualiza store local
        addActivity(boardId, data.cardId, authorName, 'card_moved', `moveu o card para etapa ${destinationTitle}`);
        // Persistir no Supabase
        await sb.from('card_activities').insert({
          board_id: boardId,
          card_id: data.cardId,
          user_id: user?.id,
          type: 'card_moved',
          description: `moveu o card para etapa ${destinationTitle}`,
        });
        // Atualizar imediatamente atividades do card movido
        queryClient.invalidateQueries({ queryKey: ['card-activities', data.cardId] });
        // Webhook: movimentação de card com TODOS os membros vinculados (nome, telefone, cargo)
        const movedCard = (cardsQuery.data || []).find(c => c.id === data.cardId) || { id: data.cardId, list_id: data.destinationListId, position: data.newPosition };
        try {
          // Garantir que o autor do movimento esteja vinculado como membro do card
          try {
            const { data: exists } = await supabase
              .from('card_members')
              .select('user_id')
              .eq('card_id', data.cardId)
              .eq('user_id', user?.id || '')
              .limit(1);
            if (!exists || exists.length === 0) {
              await supabase
                .from('card_members')
                .insert({ card_id: data.cardId, user_id: user?.id as string });
            }
          } catch (linkErr) {
            console.warn('⚠️ Falha ao garantir vínculo do autor como membro no movimento:', linkErr);
          }

          const { data: memberRows } = await supabase
            .from('card_members')
            .select(`
              card_id,
              user_id,
              profiles:profiles (id, full_name, avatar_url, phone, cargo)
            `)
            .eq('card_id', data.cardId);

          const membersFromCache = (cardMembersQuery.data || {})[data.cardId] || [];
          let members = (memberRows && memberRows.length > 0)
            ? memberRows.map(row => ({
                id: row.user_id,
                name: row.profiles?.full_name ?? 'Usuário',
                avatar: row.profiles?.avatar_url ?? undefined,
                phone: row.profiles?.phone ?? null,
                cargo: row.profiles?.cargo ?? null,
              }))
            : membersFromCache.map(m => ({
                id: m.id,
                name: m.name,
                avatar: m.avatar,
                phone: m.phone ?? null,
                cargo: m.cargo ?? null,
              }));

          // Fallback adicional: se ainda estiver vazio, incluir o autor do movimento
          if (!members || members.length === 0) {
            const { data: actorProfile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, phone, cargo')
              .eq('id', user?.id || '')
              .maybeSingle();
            members = [{
              id: user?.id as string,
              name: (actorProfile?.full_name ?? user?.email ?? 'Usuário') as string,
              avatar: actorProfile?.avatar_url ?? undefined,
              phone: actorProfile?.phone ?? null,
              cargo: actorProfile?.cargo ?? null,
            }];
          }

          await postWebhook({
            event: 'card_moved',
            movement: {
              from_list_id: data.sourceListId,
              to_list_id: data.destinationListId,
              to_position: data.newPosition,
              to_list_title: destinationTitle,
            },
            ...buildCardSnapshot(movedCard as Partial<CardRow>),
            members,
          });
        } catch (whErr) {
          console.warn('[Webhook] erro ao montar lista completa de membros em card_moved:', whErr);
          await postWebhook({
            event: 'card_moved',
            movement: {
              from_list_id: data.sourceListId,
              to_list_id: data.destinationListId,
              to_position: data.newPosition,
              to_list_title: destinationTitle,
            },
            ...buildCardSnapshot(movedCard as Partial<CardRow>),
          });
        }
      } catch (activityError) {
        console.warn('⚠️ Falha ao registrar atividade de movimentação:', activityError);
      }

      toast({
        title: 'Card movido',
        description: 'Card movido com sucesso!',
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      // Obter snapshot antes da exclusão para enviar ao webhook
      const { data: prevCard } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .maybeSingle();
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      return { cardId, prevCard };
    },
    onSuccess: async ({ cardId, prevCard }) => {
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });
      await logActivity(cardId as string, 'card_deleted', 'excluiu este cartão');
      // Webhook: exclusão de card
      await postWebhook({
        event: 'card_deleted',
        ...buildCardSnapshot((prevCard || { id: cardId, list_id: (cardsQuery.data || [])[0]?.list_id }) as Partial<CardRow>),
      });
      toast({
        title: 'Card excluído',
        description: 'O card foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir card',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCardMutation = useMutation<Card, Error, { cardId: string; updates: Partial<Card> | CardUpdateData }>({
    mutationFn: async ({ cardId, updates }: { cardId: string; updates: Partial<Card> | CardUpdateData }): Promise<Card> => {
      if (!isOnline) {
        throw new Error('Sem conexão. Tente novamente quando estiver online.');
      }
      // Mapear campos camelCase e snake_case para o formato do Supabase
      const supabaseUpdates: Record<string, unknown> = {};

      // Campos básicos
      if ('title' in updates && updates.title !== undefined) supabaseUpdates.title = updates.title as string;
      if ('description' in updates && updates.description !== undefined) supabaseUpdates.description = updates.description as string;
      if ('position' in updates && updates.position !== undefined) supabaseUpdates.position = updates.position as number;
      if ('list_id' in updates && updates.list_id !== undefined) supabaseUpdates.list_id = updates.list_id as string;
      if ('priority' in updates && updates.priority !== undefined) supabaseUpdates.priority = updates.priority as 'low' | 'medium' | 'high';
      if ('completed' in updates && updates.completed !== undefined) supabaseUpdates.completed = updates.completed as boolean;

      // Data de vencimento
      if ('due_date' in updates && updates.due_date !== undefined) {
        supabaseUpdates.due_date = updates.due_date as string;
      } else if ('dueDate' in updates && (updates as CardUpdateData).dueDate !== undefined) {
        supabaseUpdates.due_date = (updates as CardUpdateData).dueDate as string;
      }

      // Capa - cor
      if ('cover_color' in updates && updates.cover_color !== undefined) {
        supabaseUpdates.cover_color = updates.cover_color as string;
      } else if ('coverColor' in updates && (updates as CardUpdateData).coverColor !== undefined) {
        supabaseUpdates.cover_color = (updates as CardUpdateData).coverColor as string;
      }

      // Capa - imagens
      if ('cover_images' in updates && updates.cover_images !== undefined) {
        supabaseUpdates.cover_images = updates.cover_images as string[];
      } else if ('coverImages' in updates && (updates as CardUpdateData).coverImages !== undefined) {
        supabaseUpdates.cover_images = (updates as CardUpdateData).coverImages as string[];
      }

      // Timestamp de atualização
      supabaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('cards')
        .update(supabaseUpdates)
        .eq('id', cardId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Card;
    },
    onSuccess: async (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] });
      queryClient.refetchQueries({ queryKey: ['board-cards', boardId] });
      const { cardId, updates } = variables;
      const tasks: Promise<void>[] = [];
      if (cardId) {
        // Título
        if ('title' in updates && typeof updates.title === 'string') {
          tasks.push(logActivity(cardId, 'card_renamed', 'alterou o título do card'));
        }
        // Descrição
        if ('description' in updates && typeof updates.description === 'string') {
          tasks.push(logActivity(cardId, 'description_updated', 'alterou a descrição do card'));
        }
        // Prioridade
        if ('priority' in updates && typeof updates.priority === 'string') {
          tasks.push(logActivity(cardId, 'priority_changed', `alterou a prioridade para ${updates.priority}`));
        }
        // Conclusão
        if ('completed' in updates && typeof updates.completed === 'boolean') {
          const completed = updates.completed as boolean;
          tasks.push(
            logActivity(
              cardId,
              completed ? 'card_completed' : 'card_uncompleted',
              completed ? 'marcou como concluído' : 'desmarcou como concluído'
            )
          );
        }
        // Data de vencimento (snake_case ou camelCase)
        if ('due_date' in updates || ('dueDate' in (updates as CardUpdateData))) {
          const due = ('due_date' in updates
            ? (updates as Partial<Card>).due_date
            : (updates as CardUpdateData).dueDate) as string | null | undefined;
          const desc = due ? `definiu data de entrega para ${due}` : 'removeu a data de entrega';
          tasks.push(logActivity(cardId, due ? 'due_date_set' : 'due_date_cleared', desc));
        }
        // Cor da capa
        if ('cover_color' in updates || ('coverColor' in (updates as CardUpdateData))) {
          tasks.push(logActivity(cardId, 'cover_color_set', 'alterou a cor da capa'));
        }
        // Imagens da capa
        if ('cover_images' in updates || ('coverImages' in (updates as CardUpdateData))) {
          const imgs = ('cover_images' in updates
            ? (updates as Partial<Card>).cover_images
            : (updates as CardUpdateData).coverImages) as string[] | undefined;
          const count = Array.isArray(imgs) ? imgs.length : 0;
          tasks.push(logActivity(cardId, 'cover_images_updated', `ajustou imagens da capa (${count})`));
        }
      }
      if (tasks.length) {
        await Promise.allSettled(tasks);
      }
      toast({
        title: 'Card atualizado',
        description: tasks.length ? 'Alterações registradas na atividade.' : 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      console.log('❌ [DEBUG] Erro na mutation updateCard:', error);
      toast({
        title: 'Erro ao atualizar card',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: async (data, error, variables) => {
      if (data && !error) {
        // Webhook: atualização de card
        await postWebhook({
          event: 'card_updated',
          updates: variables?.updates || {},
          ...buildCardSnapshot(data as CardRow),
        });
      }
    },
  });

  return {
    board: boardQuery.data || null,
    lists: listsQuery.data || [],
    cards: cardsQuery.data || [],
    labelsByCardId: cardLabelsQuery.data || {},
    commentsCountByCardId: cardCommentsCountQuery.data || {},
    membersByCardId: cardMembersQuery.data || {},
    // Não bloquear renderização pelo carregamento de queries secundárias
    isLoading: boardQuery.isLoading || listsQuery.isLoading || cardsQuery.isLoading,
    error: boardQuery.error || listsQuery.error || cardsQuery.error || cardLabelsQuery.error || cardCommentsCountQuery.error,
    addList: addListMutation.mutate,
    addCard: addCardMutation.mutate,
    moveCard: moveCardMutation.mutate,
    deleteCard: deleteCardMutation.mutate,
    // Expor também a versão assíncrona para permitir await em fluxos de UI
    deleteCardAsync: deleteCardMutation.mutateAsync,
    updateCard: updateCardMutation.mutate,
    renameList: renameListMutation.mutate,
    deleteList: deleteListMutation.mutate,
  };
}