import { SidebarBody, SidebarLink, useSidebar } from "../ui/sidebar";
import { LayoutDashboard, Calendar, FileText, PenTool, Users, Milestone } from "lucide-react";
import { useLocation } from "react-router-dom";
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
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useAdminRole();

  const itemsToRender = isAdmin
    ? menuItems
    : menuItems.filter((item) => item.url !== "/contatos");

  return (
    <SidebarBody className="gap-4">
      <div className={open ? "px-2 py-2" : "px-1 py-1"}>
        {open ? (
          <img
            src="https://res.cloudinary.com/dhsgmhaak/image/upload/v1769126364/marca-horizontal-colorida2_btclms.png"
            alt="Coordenadoria de Comunicação"
            className="h-16 object-contain relative z-[70]"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = "/placeholder.svg";
            }}
          />
        ) : (
          <img
            src="https://res.cloudinary.com/dhsgmhaak/image/upload/v1769125813/logo-minimizada_tawhu5.png"
            alt="Logo reduzida"
            className="h-[3.75rem] w-[3.75rem] object-contain relative z-[70]"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = "/placeholder.svg";
            }}
          />
        )}
      </div>
      <div className="flex flex-col px-2 py-2">
        {itemsToRender.map((item) => (
          <SidebarLink
            key={item.title}
            link={{
              label: item.title,
              href: item.url,
              icon: <item.icon className="h-5 w-5" />,
            }}
            className={"px-1 gap-3"}
          />
        ))}
      </div>
    </SidebarBody>
  );
}
