import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const initials = useMemo(() => {
    const parts = [firstName, lastName].filter(Boolean);
    if (parts.length === 0) return "U";
    return parts.map((p) => p.charAt(0)).join("").toUpperCase().slice(0, 2);
  }, [firstName, lastName]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const md = user.user_metadata || {};

      // Nome inicial
      const mdFull = typeof md.full_name === "string" ? md.full_name : undefined;
      const mdGiven = typeof md.given_name === "string" ? md.given_name : md.first_name;
      const mdFamily = typeof md.family_name === "string" ? md.family_name : md.last_name;
      let initialFirst = "";
      let initialLast = "";
      if (mdGiven || mdFamily) {
        initialFirst = String(mdGiven || "");
        initialLast = String(mdFamily || "");
      } else if (mdFull) {
        const tokens = mdFull.trim().split(/\s+/).filter(Boolean);
        if (tokens.length >= 2) {
          initialFirst = tokens[0];
          initialLast = tokens[tokens.length - 1];
        } else {
          initialFirst = tokens[0];
        }
      } else if (user.email) {
        const local = String(user.email).split("@")[0];
        const tokens = local.split(/[._-]+/).filter(Boolean);
        initialFirst = tokens[0] || "";
        initialLast = tokens[1] || "";
      }

      // Cargo inicial
      let initialCargo = typeof md.cargo === "string" && md.cargo.trim()
        ? md.cargo
        : (typeof md.role === "string" && md.role.trim() && md.role !== "user" ? md.role : "");

      // Avatar inicial
      let initialAvatar = typeof md.avatar_url === "string" ? md.avatar_url : null;

      // Completar a partir do profiles (fallback)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, cargo, avatar_url, email, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        if (!initialFirst && profile.full_name) {
          const tokens = String(profile.full_name).trim().split(/\s+/).filter(Boolean);
          if (tokens.length >= 2) {
            initialFirst = tokens[0];
            initialLast = tokens[tokens.length - 1];
          } else {
            initialFirst = tokens[0];
          }
        }
        if (!initialCargo && profile.cargo) initialCargo = profile.cargo || "";
        if (!initialAvatar && profile.avatar_url) initialAvatar = profile.avatar_url;
      }

      setFirstName(initialFirst);
      setLastName(initialLast);
      setCargo(initialCargo || "");
      setAvatarUrl(initialAvatar);
      setExistingAvatarUrl(initialAvatar);

      // Inicializa e-mail e telefone
      const mdPhone = typeof md.phone === "string" ? md.phone : undefined;
      const initialEmail = user.email || profile?.email || "";
      const initialPhone = mdPhone || profile?.phone || "";
      setEmail(initialEmail);
      setPhone(initialPhone);
    };
    if (open) load();
  }, [open, user]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      // Libera URL anterior, se existir
      if (avatarObjectUrl) {
        try { URL.revokeObjectURL(avatarObjectUrl); } catch (_e) { void 0; }
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
        return;
      }
      const preview = URL.createObjectURL(file);
      setAvatarObjectUrl(preview);
      setAvatarUrl(preview);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || firstName.trim();

      // Upload avatar para Cloudinary
      let finalAvatarUrl = existingAvatarUrl || null;
      if (avatarFile) {
        try {
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
          
          if (!cloudName || !uploadPreset) {
            throw new Error('Cloudinary não configurado. Verifique as variáveis de ambiente.');
          }

          const formData = new FormData();
          formData.append('file', avatarFile);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'avatars');
          
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Erro ao fazer upload da imagem');
          }
          
          const data = await response.json();
          finalAvatarUrl = data.secure_url;
          console.log('Avatar uploaded to Cloudinary:', { url: finalAvatarUrl });
        } catch (uploadError: unknown) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erro desconhecido';
          console.error('Cloudinary upload error:', uploadError);
          setLastError(`Falha no upload do avatar: ${errorMessage}`);
          toast({ title: 'Falha no upload', description: errorMessage, variant: 'destructive', duration: 8000 });
        }
      }

      // Se geramos uma URL pública, refletir imediatamente no estado local
      if (finalAvatarUrl) {
        setExistingAvatarUrl(finalAvatarUrl);
        setAvatarUrl(finalAvatarUrl);
      }

      // Revoga preview blob após salvar
      if (avatarObjectUrl) {
        try { URL.revokeObjectURL(avatarObjectUrl); } catch (_e) { void 0; }
        setAvatarObjectUrl(null);
      }

      // Atualiza profiles
      const upd = await updateProfile({ full_name: fullName, cargo, avatar_url: finalAvatarUrl ?? undefined, phone, email });
      if (upd.error) {
        console.error("Erro ao salvar perfil:", upd.error);
        setLastError(`Erro ao salvar perfil: ${upd.error.message}`);
        toast({ title: "Erro ao salvar perfil", description: upd.error.message, variant: "destructive", duration: 8000 });
      }

      // Atualiza metadata e, se necessário, o e-mail de login
      const shouldUpdateEmail = email && user.email && email.trim() !== user.email.trim();
      const { error: metaErr } = await supabase.auth.updateUser({
        ...(shouldUpdateEmail ? { email: email.trim() } : {}),
        data: {
          full_name: fullName,
          given_name: firstName.trim() || undefined,
          family_name: lastName.trim() || undefined,
          cargo: cargo || undefined,
          avatar_url: finalAvatarUrl || undefined,
          phone: phone || undefined,
        },
      });
      if (metaErr) {
        console.error("Erro ao atualizar dados do usuário:", metaErr);
        setLastError(`Erro ao atualizar dados: ${metaErr.message}`);
        toast({ title: "Erro ao atualizar dados", description: metaErr.message, variant: "destructive", duration: 8000 });
      } else {
        const emailInfo = shouldUpdateEmail
          ? " Se alterou o e-mail, confirme a mudança pelo link enviado."
          : "";
        toast({ title: "Perfil atualizado", description: `Suas informações foram salvas com sucesso.${emailInfo}` });
        onOpenChange(false);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("Erro inesperado ao salvar perfil:", e);
      setLastError(`Erro inesperado: ${message}`);
      toast({ title: "Erro inesperado", description: message, variant: "destructive", duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {lastError && (
            <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {lastError}
            </div>
          )}
          <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl ?? undefined} onError={() => setAvatarUrl(null)} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar">Foto de perfil</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ex.: Maria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ex.: Silva" />
            </div>
          </div>

        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Designer, Jornalista, Coordenador" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
        </div>
      </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || (!firstName.trim() && !lastName.trim())}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}