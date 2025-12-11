import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useProfiles, type Profile } from "../../hooks/useProfiles";
import { useAdminRole } from "../../hooks/useAdminRole";
import { usePermissions, type AdminScope, type AppRole } from "../../hooks/usePermissions";
import { Checkbox } from "../ui/checkbox";
import { getInitials } from "@/lib/utils";

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Profile | null;
}

export function EditContactDialog({ open, onOpenChange, contact }: EditContactDialogProps) {
  const { updateProfile } = useProfiles();
  const { isAdmin } = useAdminRole();
  const { permissions, loading: permLoading, updatePermissions, isUpdating, hasScopesColumn } = usePermissions(contact?.id || "");
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    cargo: string;
    role: AppRole | "";
    display_name: string;
    avatar_url: string;
  }>({
    full_name: "",
    email: "",
    phone: "",
    cargo: "",
    role: "",
    display_name: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        full_name: contact.full_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        cargo: contact.cargo || "",
        role:
          (["admin", "user", "guest"].includes((contact.role ?? "") as string)
            ? (contact.role as AppRole)
            : (permissions?.role ?? "")) || "",
        display_name: contact.display_name || "",
        avatar_url: contact.avatar_url || "",
      });
    }
  }, [contact, permissions?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    setLoading(true);
    const result = await updateProfile(contact.id, {
      full_name: formData.full_name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      cargo: formData.cargo || null,
      role: formData.role || null,
      display_name: formData.display_name || null,
      avatar_url: formData.avatar_url || null,
    });

    setLoading(false);
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback>
                {getInitials(formData.full_name || formData.display_name || formData.email || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Label htmlFor="avatar_url">URL do Avatar</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("avatar_url", e.target.value)}
                placeholder="https://exemplo.com/avatar.jpg"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("full_name", e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="display_name">Nome de Exibição</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("display_name", e.target.value)}
                placeholder="Nome de exibição"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("email", e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("cargo", e.target.value)}
                placeholder="Cargo/Função"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Função no Sistema</Label>
            <Select value={formData.role} onValueChange={(value: string) => handleInputChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="guest">Convidado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && contact && (
            <div className="space-y-3 rounded-lg border p-4 bg-background/60">
              <Label>Permissões (Escopos)</Label>
              <p className="text-xs text-muted-foreground">
                Controle de acesso granular além da função.
              </p>
              {!hasScopesColumn && (
                <p className="text-xs text-muted-foreground break-words">
                  Escopos indisponíveis no banco de dados. Aplique a migração
                  <span className="mx-1 font-mono">supabase/migrations/20251108120000_add_user_roles_scopes.sql</span>.
                </p>
              )}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={Array.isArray(permissions?.scopes) && permissions!.scopes.includes('pautas_admin')}
                    onCheckedChange={async (checked: boolean | 'indeterminate') => {
                      const current: AdminScope[] = Array.isArray(permissions?.scopes)
                        ? (permissions!.scopes as AdminScope[])
                        : [];
                      const isOn = checked === true;
                      const next: AdminScope[] = isOn
                        ? (Array.from(new Set([...current, 'pautas_admin'])) as AdminScope[])
                        : current.filter((s) => s !== 'pautas_admin');
                      const roleToUse: AppRole = (formData.role || permissions?.role || 'user') as AppRole;
                      await updatePermissions({
                        userId: contact.id,
                        role: roleToUse,
                        scopes: next,
                      });
                    }}
                    disabled={permLoading || isUpdating || !hasScopesColumn}
                  />
                  <span className="text-sm">pautas_admin</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={Array.isArray(permissions?.scopes) && permissions!.scopes.includes('escala_fds_admin')}
                    onCheckedChange={async (checked: boolean | 'indeterminate') => {
                      const current: AdminScope[] = Array.isArray(permissions?.scopes)
                        ? (permissions!.scopes as AdminScope[])
                        : [];
                      const isOn = checked === true;
                      const next: AdminScope[] = isOn
                        ? (Array.from(new Set([...current, 'escala_fds_admin'])) as AdminScope[])
                        : current.filter((s) => s !== 'escala_fds_admin');
                      const roleToUse: AppRole = (formData.role || permissions?.role || 'user') as AppRole;
                      await updatePermissions({
                        userId: contact.id,
                        role: roleToUse,
                        scopes: next,
                      });
                    }}
                    disabled={permLoading || isUpdating || !hasScopesColumn}
                  />
                  <span className="text-sm">escala_fds_admin</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}