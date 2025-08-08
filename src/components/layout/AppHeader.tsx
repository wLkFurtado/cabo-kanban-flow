import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2" aria-label="Comunicação Cabo Frio">
          <div className="h-6 w-6 rounded bg-[hsl(var(--primary))] shadow-[var(--shadow-glow)]" />
          <span className="text-sm font-semibold tracking-wide">Comunicação Cabo Frio</span>
        </a>
        <nav className="flex items-center gap-2">
          <Button variant="outline">Filtros</Button>
          <Button>Novo Board</Button>
        </nav>
      </div>
    </header>
  );
}
