import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link to="/login">Entrar</Link>
        </Button>
        <Button asChild>
          <Link to="/register">Cadastrar</Link>
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getUserName = () => {
    return user.user_metadata?.full_name || user.email || 'Usuário';
  };

  const getUserRole = () => {
    return user.user_metadata?.role || 'user';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-sm font-medium">{getUserName()}</span>
        <span className="text-xs text-muted-foreground">{getUserRole()}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.user_metadata?.avatar_url} alt={`Foto de perfil de ${getUserName()}`} />
              <AvatarFallback>{getInitials(user.user_metadata?.full_name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-2">
            <User size={16} /> {getUserName()}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut size={14} className="mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
