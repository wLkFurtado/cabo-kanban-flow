import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar";
import { LayoutDashboard, Calendar, FileText, PenTool, Users, Milestone } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminRole } from "../../hooks/useAdminRole";
const menuItems = [
  { title: "Boards", url: "/", icon: LayoutDashboard },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pautas", url: "/pautas", icon: FileText },
  { title: "Escala FDS", url: "/escala-fds", icon: Calendar },
  { title: "Contatos", url: "/contatos", icon: Users },
  { title: "Agenda Institucional", url: "/agenda-institucional", icon: Calendar },
  { title: "Gerador de texto", url: "/gerador-texto", icon: PenTool },
  { title: "Sugestões de melhoria", url: "/melhorias", icon: Milestone },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useAdminRole();

  const itemsToRender = isAdmin
    ? menuItems
    : menuItems.filter((item) => item.url !== "/contatos");

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-border h-16">
        <div className="flex items-center gap-2 px-4 h-full">
          <img
            src="https://ankliiywmcpncymdlvaa.supabase.co/storage/v1/object/sign/images/marca-horizontal-colorida.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YzhjY2FlYS1lYTVkLTRiMzYtOWJiZS03NmRkYmRkNjhlYTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbWFyY2EtaG9yaXpvbnRhbC1jb2xvcmlkYS5wbmciLCJpYXQiOjE3NjA2NTMwMzcsImV4cCI6MTg4Njc5NzAzN30.z64jgDXzJIaXWUpdmL_lbDE69CPWXjbUVDaT8lW1p9k"
            alt="Coordenadoria de Comunicação"
            className={collapsed ? "h-9 w-9 object-contain relative z-[70]" : "h-14 object-contain relative z-[70]"}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = "/placeholder.svg";
            }}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {itemsToRender.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {/* Enable desktop toggling via rail */}
      <SidebarRail />
    </Sidebar>
  );
}
