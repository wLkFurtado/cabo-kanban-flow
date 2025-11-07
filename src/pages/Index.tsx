import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardCreateDialog } from "@/components/boards/BoardCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Bug } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";
import { useBoardsStore } from "@/state/boards/store";
import { Board as KanbanBoard } from "@/state/kanbanTypes";
import { supabase } from "@/integrations/supabase/client";

interface SupabaseBoard {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  cover_url?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { boards, loading, error } = useBoards();
  const initializeTemplateBoards = useBoardsStore((s) => s.initializeTemplateBoards);
  const [debugResult, setDebugResult] = useState<{
    userId?: string;
    allBoards?: { id: string; title: string; owner_id: string }[] | null;
    memberships?: { board_id: string; user_id: string }[] | null;
    ownedBoards?: { id: string; title: string; owner_id: string }[] | null;
    errors?: { allBoardsError?: unknown; membershipError?: unknown; ownedError?: unknown };
  } | null>(null);



  useEffect(() => {
    initializeTemplateBoards();
  }, [initializeTemplateBoards]);

  // Debug function to test board access
  const debugBoardAccess = async () => {
    try {
      console.log('🐛 [DEBUG] Testing board access...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🐛 [DEBUG] Current user:', user?.id);
      
      // Test direct board query
      const { data: allBoards, error: allBoardsError } = await supabase
        .from('boards')
        .select('id, title, owner_id');
      
      console.log('🐛 [DEBUG] All boards query result:', { allBoards, allBoardsError });
      
      // Test board_members query
      const { data: memberships, error: membershipError } = await supabase
        .from('board_members')
        .select('board_id, user_id')
        .eq('user_id', user?.id || '');
        
      console.log('🐛 [DEBUG] Board memberships query result:', { memberships, membershipError });
      
      // Test owned boards query
      const { data: ownedBoards, error: ownedError } = await supabase
        .from('boards')
        .select('id, title, owner_id')
        .eq('owner_id', user?.id);
        
      console.log('🐛 [DEBUG] Owned boards query result:', { ownedBoards, ownedError });
      setDebugResult({
        userId: user?.id,
        allBoards,
        memberships,
        ownedBoards,
        errors: { allBoardsError, membershipError, ownedError },
      });
      
    } catch (error) {
      console.error('🐛 [DEBUG] Error in debug function:', error);
    }
  };

  // Função para criar board de teste
  const createTestBoard = async () => {
    try {
      console.log("🧪 Criando board de teste...");
      
      // Primeiro, vamos verificar se já existe um board de teste
      if (boards && boards.some(b => b.title === "Board de Teste - Drag & Drop")) {
        console.log("✅ Board de teste já existe");
        return;
      }

      // Criar board usando o hook useBoards (se disponível)
      // Por enquanto, vamos apenas logar que precisamos criar
      console.log("📝 Precisamos implementar criação de board de teste");
      
    } catch (error) {
      console.error("❌ Erro ao criar board de teste:", error);
    }
  };

  // Convert Supabase boards to kanban format
  const convertToKanbanBoard = (supabaseBoard: SupabaseBoard): KanbanBoard => ({
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
          <p className="text-red-600">Erro ao carregar boards: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={debugBoardAccess}>
            <Bug className="mr-2 h-4 w-4" />
            Debug Access
          </Button>
          <BoardCreateDialog
            trigger={
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Board
              </Button>
            }
          />
        </div>
      </div>
      {debugResult && (
        <div className="mb-6 rounded-md border p-4 bg-muted/30">
          <h2 className="text-sm font-semibold mb-2">Debug de Acesso</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Usuário atual: <span className="font-mono">{debugResult.userId || 'desconhecido'}</span></p>
            <p>Total de boards via RLS: {debugResult.allBoards?.length ?? 0}</p>
            <p>Boards próprios: {debugResult.ownedBoards?.length ?? 0}</p>
            <p>Memberships retornados: {debugResult.memberships?.length ?? 0}</p>
          </div>
          {debugResult.allBoards && debugResult.allBoards.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Boards visíveis:</p>
              <ul className="text-xs grid grid-cols-1 md:grid-cols-2 gap-2">
                {debugResult.allBoards.map(b => (
                  <li key={b.id} className="rounded border px-2 py-1 bg-background">
                    <span className="font-mono">{b.id}</span> — {b.title} — owner: <span className="font-mono">{b.owner_id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
