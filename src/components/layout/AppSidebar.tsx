import { Button } from "@/components/ui/button";

const recentBoards = [
  { id: "b1", title: "Campanha Verão" },
  { id: "b2", title: "Gestão de Conteúdo" },
  { id: "b3", title: "Assessoria de Imprensa" },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:block w-64 border-r bg-sidebar/50">
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground mb-2">Boards recentes</h2>
          <ul className="space-y-1">
            {recentBoards.map((b) => (
              <li key={b.id}>
                <a
                  href="#"
                  className="block rounded px-3 py-2 text-sm hover:bg-muted/60"
                >
                  {b.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <Button className="w-full">Criar novo board</Button>
        </div>
      </div>
    </aside>
  );
}
