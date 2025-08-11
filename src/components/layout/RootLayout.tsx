import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boardsStore";
import { Search } from "lucide-react";

export default function RootLayout() {
  const createBoard = useBoardsStore((s) => s.createBoard);
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-3 md:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger aria-label="Abrir/fechar menu" />
            <div className="flex-1 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-[hsl(var(--primary))] shadow-[var(--shadow-glow)]" />
                <span className="text-sm font-semibold tracking-wide hidden sm:inline">Comunicação Cabo Frio</span>
              </div>

              <div className="ml-auto hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input className="pl-8 w-64" placeholder="Buscar" aria-label="Buscar" />
                </div>
                <Button variant="outline">Filtros</Button>
                <Button onClick={() => { const id = createBoard(""); navigate(`/board/${id}`); }}>Novo Board</Button>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
