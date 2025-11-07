import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader } from '../components/boards/BoardHeader';
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { DragTestSimple } from "../components/kanban/DragTestSimple";
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

  const { board, lists, cards, labelsByCardId, commentsCountByCardId, membersByCardId, isLoading, error, addList, addCard, moveCard } = useBoardDetails(boardId ?? '');

  // Convert Supabase data to Kanban format
  const kanbanData = useMemo(() => {
    if (!lists || !cards) {
      return { lists: [], cards: [] };
    }

    const convertedLists: List[] = lists.map((list: SupabaseList) => ({
      id: list.id,
      title: list.title,
      color: list.color || '#6366f1',
      position: list.position
    }));

    const convertedCards: Card[] = cards.map((rawCard) => {
      const labelRows: SupabaseLabel[] = (labelsByCardId?.[rawCard.id] || []) as SupabaseLabel[];
      const commentsCount = commentsCountByCardId?.[rawCard.id] || 0;
      const membersRows: SupabaseMember[] = (membersByCardId?.[rawCard.id] || []) as SupabaseMember[];
      return {
        id: rawCard.id,
        title: rawCard.title,
        description: rawCard.description ?? '',
        list_id: rawCard.list_id,
        position: rawCard.position,
        priority: (rawCard.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        completed: !!rawCard.completed,
        dueDate: rawCard.due_date ?? undefined,
        // Mapear cover_color do Supabase para coverColor do Kanban
        coverColor: (rawCard.cover_color ?? undefined) as 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | undefined,
        // Mapear cover_images do Supabase para coverImages do Kanban
        coverImages: rawCard.cover_images ?? [],
        assignees: [],
        tags: [],
        attachments: [],
        labels: labelRows.map((l: SupabaseLabel) => ({ id: l.id, name: l.name, color: l.color })),
        members: membersRows.map((m: SupabaseMember) => ({ id: m.id, name: m.name, avatar: m.avatar })),
        comments: Array.from({ length: commentsCount }).map((_: unknown, i: number) => ({
          id: `${rawCard.id}-comment-${i}`,
          cardId: rawCard.id,
          author: '',
          content: '',
          timestamp: new Date().toISOString(),
          type: 'comment' as const,
        })),
      };
    });

    return { lists: convertedLists, cards: convertedCards };
  }, [lists, cards, labelsByCardId, commentsCountByCardId, membersByCardId]);

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

  // Group cards by list and sort by position
  const cardsByList = kanbanData.cards.reduce((acc, card) => {
    if (!acc[card.list_id]) {
      acc[card.list_id] = [];
    }
    acc[card.list_id].push(card);
    return acc;
  }, {} as Record<string, Card[]>);

  // Sort cards by position within each list
  Object.keys(cardsByList).forEach((listId: string) => {
    cardsByList[listId].sort((a: Card, b: Card) => a.position - b.position);
  });



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
          />
        </div>
    </section>
  );
}
