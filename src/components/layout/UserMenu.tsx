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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileCargo, setProfileCargo] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Fallback: buscar nome/cargo da tabela profiles se metadata estiver faltando
  const fetchProfile = async () => {
    if (!user) return;
    const md = user.user_metadata || {};
    const lacksName = !md.full_name && !md.name && !md.given_name && !md.first_name;
    const lacksCargo = !md.cargo;
    const lacksAvatar = !md.avatar_url;

    if (!(lacksName || lacksCargo || lacksAvatar)) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, cargo, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      if (lacksName && data.full_name) setProfileName(data.full_name);
      if (lacksCargo && data.cargo) setProfileCargo(data.cargo);
      if (lacksAvatar && data.avatar_url) setProfileAvatar(data.avatar_url);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const toTitle = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  const computeFullName = () => {
    const md = user.user_metadata || {};
    const fullName = md.full_name || md.name;
    const given = md.given_name || md.first_name;
    const family = md.family_name || md.last_name;
    if (fullName && typeof fullName === 'string') {
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return `${toTitle(parts[0])} ${toTitle(parts[parts.length - 1])}`;
      return toTitle(parts[0]);
    }
    if (given || family) {
      const g = toTitle(String(given || ''));
      const f = toTitle(String(family || ''));
      return [g, f].filter(Boolean).join(' ').trim() || 'Usuário';
    }
    if (profileName) {
      const parts = profileName.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return `${toTitle(parts[0])} ${toTitle(parts[parts.length - 1])}`;
      return toTitle(parts[0]);
    }
    // Derivar do email: usar nome e sobrenome a partir do local-part
    const local = (user.email || '').split('@')[0];
    if (local) {
      const tokens = local.split(/[._-]+/).filter(Boolean);
      if (tokens.length >= 2) return `${toTitle(tokens[0])} ${toTitle(tokens[1])}`;
      return toTitle(tokens[0]);
    }
    return 'Usuário';
  };

  const getInitials = () => {
    const name = computeFullName();
    if (!name || name === 'Usuário') return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getUserName = () => computeFullName();

  const getUserCargo = () => {
    const md = user.user_metadata || {};
    const cargoFromMeta = typeof md.cargo === 'string' && md.cargo.trim() ? md.cargo : undefined;
    const cargoFromRole = typeof md.role === 'string' && md.role.trim() && md.role !== 'user' ? md.role : undefined;
    return cargoFromMeta || cargoFromRole || profileCargo || 'Cargo não definido';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-sm font-medium">{getUserName()}</span>
        <span className="text-xs text-muted-foreground">{getUserCargo()}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.user_metadata?.avatar_url || profileAvatar || undefined} alt={`Foto de perfil de ${getUserName()}`} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-2">
            <User size={16} /> {getUserName()}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-2" /> Editar perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut size={14} className="mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditProfileDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            // Recarregar dados do perfil ao fechar para refletir alterações
            fetchProfile();
          }
        }}
      />
    </div>
  );
}
