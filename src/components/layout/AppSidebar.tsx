import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boardsStore";
import { Link, useNavigate } from "react-router-dom";

export function AppSidebar() {
  const boardOrder = useBoardsStore((s) => s.boardOrder);
  const boards = useBoardsStore((s) => s.boards);
  const createBoard = useBoardsStore((s) => s.createBoard);
  const navigate = useNavigate();

  return (
    <aside className="hidden md:block w-64 border-r bg-sidebar/50">
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground mb-2">Boards recentes</h2>
          <ul className="space-y-1">
            {boardOrder.map((id) => (
              <li key={id}>
                <Link
                  to={`/board/${id}`}
                  className="block rounded px-3 py-2 text-sm hover:bg-muted/60"
                >
                  {boards[id]?.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <Button
            className="w-full"
            onClick={() => {
              const id = createBoard("");
              navigate(`/board/${id}`);
            }}
          >
            Criar novo board
          </Button>
        </div>
      </div>
    </aside>
  );
}
