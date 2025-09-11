import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, Settings } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";
import { BoardCreateDialog } from "@/components/boards/BoardCreateDialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";
import { useBoardsStore } from "@/state/boardsStore";

export function MainHeader() {
  const location = useLocation();
  const boards = useBoardsStore((s) => s.boards);
  
  // Extract board ID from path if we're on a board page
  const boardId = location.pathname.match(/\/board\/(.+)/)?.[1];
  const currentBoard = boardId ? boards[boardId] : null;

  const getBreadcrumbItems = () => {
    if (currentBoard) {
      return (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Boards</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentBoard.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }
    
    return (
      <BreadcrumbItem>
        <BreadcrumbPage>Boards</BreadcrumbPage>
      </BreadcrumbItem>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top section */}
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="md:hidden" />
        

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-10 h-10 bg-muted/50 border-0 focus:bg-background" 
              placeholder="Buscar boards, cards..." 
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
            <Bell size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
            <Settings size={18} />
          </Button>
          <BoardCreateDialog trigger={<Button variant="default" size="sm">Novo Board</Button>} />
          <UserMenu />
        </div>
      </div>

      {/* Breadcrumb section */}
      <div className="flex h-10 items-center px-4 md:px-6 bg-muted/30 border-t">
        <Breadcrumb>
          <BreadcrumbList>
            {getBreadcrumbItems()}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}