import { useBoardsStore } from "@/state/boardsStore";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardCreateDialog } from "@/components/boards/BoardCreateDialog";
const Index = () => {
  const boards = useBoardsStore((s) => s.boards);
  const boardOrder = useBoardsStore((s) => s.boardOrder);
  const [title, setTitle] = useState("");

  useEffect(() => {
    document.title = "Meus Boards | Comunicação Cabo Frio";
  }, []);


  return (
    <section>
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
        />
        <BoardCreateDialog
          initialTitle={title}
          onCreated={() => setTitle("")}
          trigger={<Button>Criar novo board</Button>}
        />
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
  );
};

export default Index;
