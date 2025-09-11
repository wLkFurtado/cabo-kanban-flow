import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { BoardHeader } from "@/components/boards/BoardHeader";
import { ViewTabs } from "@/components/boards/ViewTabs";
import { useBoardsStore } from "@/state/boardsStore";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function BoardView() {
  const { boardId } = useParams();
  const board = useBoardsStore((s) => (boardId ? s.boards[boardId] : undefined));
  const moveCard = useBoardsStore((s) => s.moveCard);
  const moveList = useBoardsStore((s) => s.moveList);
  const addList = useBoardsStore((s) => s.addList);
  const navigate = useNavigate();

  console.log("BoardView - boardId:", boardId);
  console.log("BoardView - board found:", !!board);
  console.log("BoardView - board data:", board);

  useEffect(() => {
    if (board) document.title = `${board.title} | Comunicação Cabo Frio`;
  }, [board?.title]);

  if (!board) {
    return (
      <section className="p-4">
        <h1 className="text-2xl font-bold">Board não encontrado</h1>
        <p className="text-muted-foreground mt-2">O board que você tentou acessar não existe.</p>
        <Link className="underline mt-4 inline-block" to="/">Voltar para Meus Boards</Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <BoardHeader board={board} onDeleted={() => navigate("/")} />
      
      <ViewTabs>
        <KanbanBoard
          boardId={board.id}
          listsOrder={board.listsOrder}
          lists={board.lists}
          cardsByList={board.cardsByList}
          onMoveCard={(fromId, toId, fromIdx, toIdx) =>
            moveCard(board.id, fromId, toId, fromIdx, toIdx)
          }
          onMoveList={(fromIdx, toIdx) => moveList(board.id, fromIdx, toIdx)}
          onAddList={(title) => addList(board.id, title)}
        />
      </ViewTabs>
    </section>
  );
}
