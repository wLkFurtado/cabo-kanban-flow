import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { EditableText } from "@/components/editable/EditableText";
import { BoardActions } from "@/components/boards/BoardActions";
import { useBoardsStore } from "@/state/boardsStore";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Columns3, Filter, SortAsc } from "lucide-react";

export default function BoardView() {
  const { boardId } = useParams();
  const board = useBoardsStore((s) => (boardId ? s.boards[boardId] : undefined));
  const moveCard = useBoardsStore((s) => s.moveCard);
  const moveList = useBoardsStore((s) => s.moveList);
  const addList = useBoardsStore((s) => s.addList);
  const updateBoardTitle = useBoardsStore((s) => s.updateBoardTitle);
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

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
    <section>
      <header className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {board.icon && <span className="text-2xl leading-none">{board.icon}</span>}
              <h1 ref={titleRef} className="text-2xl md:text-3xl font-bold tracking-tight">
                <EditableText value={board.title} onSubmit={(v) => updateBoardTitle(board.id, v)} />
              </h1>
            </div>
            {board.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{board.description}</p>
            )}
          </div>
          <BoardActions
            boardId={board.id}
            onRename={() => {
              const btn = titleRef.current?.querySelector(
                'button[aria-label="Editar texto"]'
              ) as HTMLButtonElement | null;
              btn?.click();
            }}
            onDeleted={() => navigate("/")}
          />
        </div>
        {!board.description && (
          <p className="text-sm text-muted-foreground mt-1">Organize suas demandas por listas e cartões.</p>
        )}
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm"><Columns3 className="mr-2 h-4 w-4" />Kanban</Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtrar</Button>
          <Button variant="outline" size="sm"><SortAsc className="mr-2 h-4 w-4" />Ordenar</Button>
        </div>
      </div>

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
    </section>
  );
}
