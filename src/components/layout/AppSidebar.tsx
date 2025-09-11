import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Building2 } from "lucide-react";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
        {/* Aqui serão adicionadas as futuras abas do SaaS */}
        <div className="p-4 text-center text-sm text-muted-foreground">
          {!collapsed && "Menu em desenvolvimento"}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
