import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader } from '@/components/boards/BoardHeader';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ViewTabs } from '@/components/boards/ViewTabs';
import { useBoardDetails } from '@/hooks/useBoards';
import { useAuth } from '@/hooks/useAuth';
import type { Card, List } from "@/state/kanbanTypes";

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);
  
  if (authLoading) {
    return <div>Verificando autenticação...</div>;
  }
  
  if (!user) {
    return <div>Redirecionando para login...</div>;
  }
  
  if (!boardId) {
    return <div>Board ID não encontrado</div>;
  }

  const { board, lists, cards, isLoading, error } = useBoardDetails(boardId);

  // Convert Supabase data to Kanban format
  const kanbanData = useMemo(() => {
    if (!lists || !cards) {
      return { lists: [], cards: [] };
    }

    const convertedLists: List[] = lists.map(list => ({
      id: list.id,
      title: list.title,
      color: list.color || '#6366f1',
      position: list.position
    }));

    const convertedCards: Card[] = cards.map(card => ({
      id: card.id,
      title: card.title,
      description: card.description || '',
      listId: card.list_id,
      position: card.position,
      priority: card.priority as 'low' | 'medium' | 'high' | 'urgent' || 'medium',
      completed: card.completed || false,
      dueDate: card.due_date || undefined,
      assignees: [],
      tags: [],
      attachments: [],
      labels: [],
      members: []
    }));

    return { lists: convertedLists, cards: convertedCards };
  }, [lists, cards]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar board: {error instanceof Error ? error.message : 'Erro desconhecido'}</div>;
  }

  if (!board) {
    return <div>Board não encontrado</div>;
  }

  // Mock functions for now
  const handleAddList = async (title: string) => {
    console.log('Add list:', title);
  };

  const handleAddCard = async (listId: string, title: string) => {
    console.log('Add card:', { listId, title });
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    console.log('Update card:', { cardId, updates });
  };

  const handleDeleteCard = async (cardId: string) => {
    console.log('Delete card:', cardId);
  };

  const handleMoveCard = async (cardId: string, newListId: string, newPosition: number) => {
    console.log('Move card:', { cardId, newListId, newPosition });
  };

  // Convert lists array to Record format for KanbanBoard
  const listsRecord = kanbanData.lists.reduce((acc, list) => {
    acc[list.id] = list;
    return acc;
  }, {} as Record<string, List>);

  // Group cards by list
  const cardsByList = kanbanData.cards.reduce((acc, card) => {
    if (!acc[card.listId]) {
      acc[card.listId] = [];
    }
    acc[card.listId].push(card);
    return acc;
  }, {} as Record<string, Card[]>);

  return (
    <section className="flex flex-col h-full">
      <BoardHeader
        board={{
          id: board.id,
          title: board.title,
          description: board.description || '',
          createdAt: board.created_at,
          listsOrder: kanbanData.lists.map(l => l.id),
          lists: listsRecord,
          cardsByList: cardsByList,
          icon: "📋",
          color: "#7c3aed",
          customFields: [],
          isTemplate: false
        }}
        onDeleted={() => {}}
      />
      
      <ViewTabs>
        <div></div>
      </ViewTabs>
      
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          boardId={boardId}
          listsOrder={kanbanData.lists.map(l => l.id)}
          lists={listsRecord}
          cardsByList={cardsByList}
          onMoveCard={(fromListId, toListId, fromIndex, toIndex) => {
            console.log('Move card:', { fromListId, toListId, fromIndex, toIndex });
          }}
          onMoveList={(fromIndex, toIndex) => {
            console.log('Move list:', { fromIndex, toIndex });
          }}
          onAddList={handleAddList}
        />
      </div>
    </section>
  );
}
