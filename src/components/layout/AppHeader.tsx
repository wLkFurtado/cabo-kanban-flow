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
            src="https://ankliiywmcpncymdlvaa.supabase.co/storage/v1/object/sign/images/marca-horizontal-colorida.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YzhjY2FlYS1lYTVkLTRiMzYtOWJiZS03NmRkYmRkNjhlYTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbWFyY2EtaG9yaXpvbnRhbC1jb2xvcmlkYS5wbmciLCJpYXQiOjE3NjA2NTMwMzcsImV4cCI6MTg4Njc5NzAzN30.z64jgDXzJIaXWUpdmL_lbDE69CPWXjbUVDaT8lW1p9k"
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
