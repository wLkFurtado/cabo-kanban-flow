import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useBoardsStore } from "@/state/boardsStore";
import { useParams, Link } from "react-router-dom";

export default function BoardView() {
  const { boardId } = useParams();
  const board = useBoardsStore((s) => (boardId ? s.boards[boardId] : undefined));
  const moveCard = useBoardsStore((s) => s.moveCard);

  if (!board) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold">Board não encontrado</h1>
          <p className="text-muted-foreground mt-2">
            O board que você tentou acessar não existe.
          </p>
          <Link className="underline mt-4 inline-block" to="/">
            Voltar para Meus Boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)]">
      <AppHeader />
      <div className="container mx-auto">
        <div className="flex w-full min-h-[calc(100vh-56px)]">
          <AppSidebar />
          <main className="flex-1">
            <section className="px-4 md:px-6 py-6 md:py-8">
              <header className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{board.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">Organize suas demandas por listas e cartões.</p>
              </header>

              <KanbanBoard
                listsOrder={board.listsOrder}
                lists={board.lists}
                cardsByList={board.cardsByList}
                onMoveCard={(fromId, toId, fromIdx, toIdx) =>
                  moveCard(board.id, fromId, toId, fromIdx, toIdx)
                }
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
