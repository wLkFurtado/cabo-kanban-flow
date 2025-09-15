import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardCreateDialog } from "@/components/boards/BoardCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";
import { useBoardsStore } from "@/state/boardsStore";
import { Board as KanbanBoard } from "@/state/kanbanTypes";

const Index = () => {
  const navigate = useNavigate();
  const { boards, loading, error } = useBoards();
  const initializeTemplateBoards = useBoardsStore((s) => s.initializeTemplateBoards);

  useEffect(() => {
    initializeTemplateBoards();
  }, [initializeTemplateBoards]);

  // Convert Supabase boards to kanban format
  const convertToKanbanBoard = (supabaseBoard: any): KanbanBoard => ({
    id: supabaseBoard.id,
    title: supabaseBoard.title,
    description: supabaseBoard.description,
    createdAt: supabaseBoard.created_at,
    listsOrder: [],
    lists: {},
    cardsByList: {},
    icon: "📋", // Default icon for Supabase boards
    color: "#7c3aed", // Default color
    customFields: [],
    isTemplate: false
  });

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Boards</h1>
            <p className="text-gray-600 mt-1">Crie e gerencie boards para suas mídias sociais.</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando boards...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Boards</h1>
            <p className="text-gray-600 mt-1">Crie e gerencie boards para suas mídias sociais.</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Erro ao carregar boards: {error.message}</p>
        </div>
      </section>
    );
  }


  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Boards</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie boards para suas mídias sociais.</p>
        </div>
        <BoardCreateDialog
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Board
            </Button>
          }
        />
      </div>

        {!boards || boards.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum board encontrado</h2>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro board para organizar suas mídias sociais.</p>
            <BoardCreateDialog
              trigger={
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro board
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <BoardCard key={board.id} board={convertToKanbanBoard(board)} />
            ))}
          </div>
        )}
    </section>
  );
};

export default Index;
