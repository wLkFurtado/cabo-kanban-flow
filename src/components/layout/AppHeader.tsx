import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boardsStore";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const createBoard = useBoardsStore((s) => s.createBoard);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2" aria-label="Comunicação Cabo Frio">
          <div className="h-6 w-6 rounded bg-[hsl(var(--primary))] shadow-[var(--shadow-glow)]" />
          <span className="text-sm font-semibold tracking-wide">Comunicação Cabo Frio</span>
        </a>
        <nav className="flex items-center gap-2">
          <Button variant="outline">Filtros</Button>
          <Button onClick={() => { const id = createBoard(""); navigate(`/board/${id}`); }}>Novo Board</Button>
        </nav>
      </div>
    </header>
  );
}
