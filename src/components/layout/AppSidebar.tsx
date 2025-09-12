import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Building2, LayoutDashboard, Calendar, FileText, PenTool } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Boards", url: "/", icon: LayoutDashboard },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pautas", url: "/pautas", icon: FileText },
  { title: "Gerador de texto", url: "/gerador-texto", icon: PenTool },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 p-4">
          <Building2 className="h-6 w-6 text-primary" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Comunicação</span>
              <span className="font-semibold text-sm">Cabo Frio</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {menuItems.map((item) => (
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
    </Sidebar>
  );
}
