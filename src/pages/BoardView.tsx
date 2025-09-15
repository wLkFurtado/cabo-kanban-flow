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
      attachments: []
    }));

    return { lists: convertedLists, cards: convertedCards };
  }, [lists, cards]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar board: {error.message}</div>;
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

  return (
    <section className="flex flex-col h-full">
      <BoardHeader
        board={{
          id: board.id,
          title: board.title,
          description: board.description || '',
          visibility: board.visibility as 'private' | 'team' | 'public',
          members: [],
          lists: kanbanData.lists,
          createdAt: board.created_at,
          updatedAt: board.updated_at
        }}
        onAddMember={() => {}}
        onUpdateBoard={() => {}}
        onDeleteBoard={() => {}}
      />
      
      <ViewTabs />
      
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          lists={kanbanData.lists}
          cards={kanbanData.cards}
          onAddList={handleAddList}
          onAddCard={handleAddCard}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onMoveCard={handleMoveCard}
        />
      </div>
    </section>
  );
}
