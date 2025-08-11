import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/state/boardsStore";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Columns3 } from "lucide-react";

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const boardOrder = useBoardsStore((s) => s.boardOrder);
  const boards = useBoardsStore((s) => s.boards);
  const createBoard = useBoardsStore((s) => s.createBoard);
  const navigate = useNavigate();
  const location = useLocation();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className={getNavCls}>
                    <Home className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Início</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Boards recentes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {boardOrder.map((id) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton asChild>
                    <NavLink to={`/board/${id}`} className={getNavCls}>
                      <Columns3 className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{boards[id]?.title || "Sem título"}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          className="w-full"
          onClick={() => {
            const id = createBoard("");
            navigate(`/board/${id}`);
          }}
        >
          Criar novo board
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
