import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader } from '../components/boards/BoardHeader';
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { ViewTabs } from '../components/boards/ViewTabs';
import { useBoardDetails } from '../hooks/useBoards';
import { useAuth } from '../hooks/useAuth';
import type { Card, List } from "../state/kanbanTypes";
// Tipos de origem Supabase usados na conversão
type SupabaseList = { id: string; title: string; color?: string; position: number };
type SupabaseLabel = { id: string; name: string; color: string };
type SupabaseMember = { id: string; name: string; avatar?: string };

// Tipo específico para card do Supabase (campos possivelmente nulos)
type SupabaseCard = {
  id: string;
  title: string;
  description: string | null;
  list_id: string;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  completed: boolean | null;
  due_date: string | null;
  cover_color: string | null;
  cover_images: string[] | null;
};

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { board, lists, cards, labelsByCardId, commentsCountByCardId, membersByCardId, isLoading, error, addList, addCard, moveCard, renameList, deleteList } = useBoardDetails(boardId ?? '');

  // Helpers simples para conversão e agrupamento (KISS)
  const convertKanbanData = (
    rawLists: SupabaseList[] | undefined,
    rawCards: SupabaseCard[] | undefined,
    labelsMap: Record<string, SupabaseLabel[]> | undefined,
    commentsCountMap: Record<string, number> | undefined,
    membersMap: Record<string, SupabaseMember[]> | undefined,
  ): { lists: List[]; cards: Card[] } => {
    if (!rawLists || !rawCards) return { lists: [], cards: [] };

    const listsOut: List[] = rawLists.map((l) => ({
      id: l.id,
      title: l.title,
      color: l.color || '#6366f1',
      position: l.position,
    }));

    const cardsOut: Card[] = rawCards.map((c) => {
      const labelRows = labelsMap?.[c.id] || [];
      const membersRows = membersMap?.[c.id] || [];
      const commentsCount = commentsCountMap?.[c.id] || 0;
      return {
        id: c.id,
        title: c.title,
        description: c.description ?? '',
        list_id: c.list_id,
        position: c.position,
        priority: (c.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        completed: !!c.completed,
        dueDate: c.due_date ?? undefined,
        coverColor: (c.cover_color ?? undefined) as 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | undefined,
        coverImages: c.cover_images ?? [],
        assignees: [],
        tags: [],
        attachments: [],
        labels: labelRows.map((l) => ({ id: l.id, name: l.name, color: l.color })),
        members: membersRows.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar })),
        comments: Array.from({ length: commentsCount }).map((_, i) => ({
          id: `${c.id}-comment-${i}`,
          cardId: c.id,
          author: '',
          content: '',
          timestamp: new Date().toISOString(),
          type: 'comment' as const,
        })),
      };
    });

    return { lists: listsOut, cards: cardsOut };
  };

  const kanbanData = useMemo(
    () => convertKanbanData(lists as SupabaseList[], cards as SupabaseCard[], labelsByCardId as Record<string, SupabaseLabel[]>, commentsCountByCardId as Record<string, number>, membersByCardId as Record<string, SupabaseMember[]>),
    [lists, cards, labelsByCardId, commentsCountByCardId, membersByCardId]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);
  
  // Early returns after all hooks
  if (authLoading) {
    return <div>Verificando autenticação...</div>;
  }
  
  if (!user) {
    return <div>Redirecionando para login...</div>;
  }
  
  if (!boardId) {
    return <div>Board ID não encontrado</div>;
  }

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar board: {error instanceof Error ? error.message : 'Erro desconhecido'}</div>;
  }

  if (!board) {
    return <div>Board não encontrado</div>;
  }

  // Connect with real functions from useBoardDetails
  const handleAddList = async (title: string) => {
    try {
      await addList(title);
    } catch (error) {
      console.error('Erro ao adicionar lista:', error);
    }
  };

  const handleRenameList = (listId: string, title: string) => {
    try {
      renameList({ listId, title });
    } catch (error) {
      console.error('Erro ao renomear lista:', error);
    }
  };

  const handleDeleteList = (listId: string) => {
    try {
      deleteList(listId);
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    try {
      await addCard({ listId, title });
    } catch (error) {
      console.error('Erro ao adicionar card:', error);
    }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    // TODO: Implement update card functionality
  };

  const handleMoveCard = (cardId: string, sourceListId: string, destinationListId: string, destinationIndex: number) => {
    console.log('🎯 [DEBUG] handleMoveCard chamado:', { cardId, sourceListId, destinationListId, destinationIndex });
    
    // Chamar a mutation com os parâmetros corretos
    moveCard({ 
      cardId, 
      sourceListId, 
      destinationListId, 
      newPosition: destinationIndex 
    });
  };

  const handleMoveList = (listId: string, destinationIndex: number) => {
    // TODO: Implement list movement
    console.log('🎯 [DEBUG] handleMoveList chamado:', { listId, destinationIndex });
  };

  const handleDeleteCard = async (cardId: string) => {
    // TODO: Implement delete card functionality via hook
    console.log('🗑️ Deletar card', cardId);
  };

  // Agrupar e ordenar cards de forma simples
  const groupCardsByList = (allCards: Card[]): Record<string, Card[]> => {
    const out: Record<string, Card[]> = {};
    for (const c of allCards) {
      (out[c.list_id] ||= []).push(c);
    }
    Object.keys(out).forEach((listId) => {
      out[listId].sort((a, b) => a.position - b.position);
    });
    return out;
  };

  const cardsByList = groupCardsByList(kanbanData.cards);



  return (
    <section className="flex flex-col h-full">
      <BoardHeader
        board={{
          id: board.id,
          title: board.title,
          description: board.description || '',
          createdAt: board.created_at,
          listsOrder: kanbanData.lists.map((l: List) => l.id),
          lists: kanbanData.lists.reduce((acc: Record<string, List>, list: List) => {
            acc[list.id] = list;
            return acc;
          }, {} as Record<string, List>),
          cardsByList: cardsByList,
          icon: "📋",
          color: "#7c3aed",
          customFields: [],
          isTemplate: false
        }}
        onDeleted={() => {
          // Após exclusão, voltar para a lista de boards
          navigate('/');
        }}
      />
      
      <ViewTabs>
        <div></div>
      </ViewTabs>
      
      <div className="flex-1 overflow-hidden">
          <KanbanBoard
            boardId={boardId}
            lists={kanbanData.lists}
            cards={cardsByList}
            onMoveCard={handleMoveCard}
            onMoveList={handleMoveList}
            onAddList={handleAddList}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onRenameList={handleRenameList}
            onDeleteList={handleDeleteList}
          />
        </div>
    </section>
  );
}
