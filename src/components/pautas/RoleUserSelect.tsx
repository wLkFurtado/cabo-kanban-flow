import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfiles } from "@/hooks/useProfiles";
import { getInitials } from "@/state/authStore";
import { cn } from "@/lib/utils";

interface RoleUserSelectProps {
  label: string;
  cargo: string; // Ex.: "filmmaker", "fotografo", "jornalista", "rede"
  value?: string; // profile id selecionado
  onChange: (userId?: string) => void;
  placeholder?: string;
  className?: string;
}

export function RoleUserSelect({ label, cargo, value, onChange, placeholder, className }: RoleUserSelectProps) {
  const { profiles } = useProfiles();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    const list = (profiles || []).filter(p => (p.cargo || p.role || "").toLowerCase() === cargo.toLowerCase());
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter(p => {
      const name = (p.full_name || p.display_name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [profiles, cargo, search]);

  const selected = useMemo(() => (profiles || []).find(p => p.id === value), [profiles, value]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            {selected ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selected.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(selected.full_name || selected.display_name || "")}</AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {selected.full_name || selected.display_name || selected.email || "Usuário"}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || `Selecionar ${cargo}`}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <Input
              placeholder="Buscar por nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {options.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Nenhum profissional encontrado para {cargo}
                </div>
              ) : (
                options.map((p) => (
                  <Button
                    key={p.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(p.full_name || p.display_name || "Usuário")}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{p.full_name || p.display_name || "Usuário"}</span>
                      <span className="text-xs text-muted-foreground">{p.email || ""}</span>
                    </div>
                  </Button>
                ))
              )}
            </div>
            {value && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => onChange(undefined)}>Remover seleção</Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}