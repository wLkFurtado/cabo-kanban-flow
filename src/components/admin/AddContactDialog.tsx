import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfiles, type ProfileInsert } from "@/hooks/useProfiles";
import { Loader2 } from "lucide-react";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({ open, onOpenChange }: AddContactDialogProps) {
  const { createUserWithProfile } = useProfiles();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileInsert>>({
    full_name: "",
    display_name: "",
    email: "",
    phone: "",
    cargo: "",
    role: "user",
    avatar_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await createUserWithProfile({
        email: formData.email,
        full_name: formData.full_name,
        display_name: formData.display_name || formData.full_name,
        phone: formData.phone,
        cargo: formData.cargo,
        role: formData.role || 'user',
        avatar_url: formData.avatar_url,
        password: '123456' // Senha padrão para novos usuários
      });

      if (result.success) {
        onOpenChange(false);
        setFormData({
          full_name: "",
          display_name: "",
          email: "",
          phone: "",
          cargo: "",
          role: "user",
          avatar_url: "",
        });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileInsert, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo usuário. Será criada uma conta completa com acesso ao sistema. Os campos marcados com * são obrigatórios. Senha padrão: 123456
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ""}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome de Exibição</Label>
              <Input
                id="display_name"
                value={formData.display_name || ""}
                onChange={(e) => handleInputChange("display_name", e.target.value)}
                placeholder="Nome de exibição"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo || ""}
                onChange={(e) => handleInputChange("cargo", e.target.value)}
                placeholder="Cargo/Função"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função no Sistema</Label>
            <Select
              value={formData.role || "user"}
              onValueChange={(value) => handleInputChange("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="guest">Convidado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">URL do Avatar</Label>
            <Input
              id="avatar_url"
              value={formData.avatar_url || ""}
              onChange={(e) => handleInputChange("avatar_url", e.target.value)}
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}