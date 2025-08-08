import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

const Index = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)]">
      <AppHeader />

      <div className="container mx-auto">
        <div className="flex w-full min-h-[calc(100vh-56px)]">
          <AppSidebar />

          <main className="flex-1">
            <section className="px-4 md:px-6 py-6 md:py-8">
              <header className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kanban – Campanha Verão</h1>
                <p className="text-sm text-muted-foreground mt-1">Organize as etapas da campanha de comunicação de Cabo Frio.</p>
              </header>

              <KanbanBoard />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
