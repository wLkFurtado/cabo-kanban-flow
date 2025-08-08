import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useBoardsStore } from "@/state/boardsStore";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BoardCard } from "@/components/boards/BoardCard";

const Index = () => {
  const boards = useBoardsStore((s) => s.boards);
  const boardOrder = useBoardsStore((s) => s.boardOrder);
  const createBoard = useBoardsStore((s) => s.createBoard);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");

  const onCreate = () => {
    const id = createBoard(title.trim());
    setTitle("");
    navigate(`/board/${id}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)]">
      <AppHeader />
      <div className="container mx-auto">
        <div className="flex w-full min-h-[calc(100vh-56px)]">
          <AppSidebar />
          <main className="flex-1">
            <section className="px-4 md:px-6 py-6 md:py-8">
              <header className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meus Boards</h1>
                <p className="text-sm text-muted-foreground mt-1">Crie e gerencie boards para suas mídias sociais.</p>
              </header>

              <div className="flex items-center gap-2 mb-6">
                <input
                  aria-label="Título do board"
                  placeholder="Nome do board"
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onCreate()}
                />
                <Button onClick={onCreate}>Criar novo board</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boardOrder.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum board ainda. Crie o primeiro acima.</div>
                )}
                {boardOrder.map((id) => (
                  <BoardCard key={id} board={boards[id]} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
