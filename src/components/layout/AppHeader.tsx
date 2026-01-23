import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boards/store";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const createBoard = useBoardsStore((s) => s.createBoard);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2" aria-label="Coordenadoria de Comunicação">
          <img
            src="https://res.cloudinary.com/dhsgmhaak/image/upload/v1769125846/marca-horizontal-colorida_cuj9jt.png"
            alt="Coordenadoria de Comunicação"
            className="h-12 object-contain select-none"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = "/placeholder.svg";
            }}
          />
        </a>
        <nav className="flex items-center gap-2">
          <Button variant="outline">Filtros</Button>
          <Button onClick={() => { const id = createBoard(""); navigate(`/board/${id}`); }}>Novo Board</Button>
        </nav>
      </div>
    </header>
  );
}
