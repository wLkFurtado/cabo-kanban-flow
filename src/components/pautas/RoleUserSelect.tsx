import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useProfiles } from "../../hooks/useProfiles";
import type { Profile } from "../../hooks/useProfiles";
import { getInitials } from "@/lib/utils";
import { cn } from "../../lib/utils";

interface RoleUserSelectProps {
  label: string;
  cargo: string; // Ex.: "filmmaker", "fotografo", "jornalista", "rede"
  cargoFilter?: string | string[]; // filtros adicionais para incluir outros cargos relacionados
  value?: string; // profile id selecionado
  onChange: (userId?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RoleUserSelect({ label, cargo, cargoFilter, value, onChange, placeholder, className, disabled }: RoleUserSelectProps) {
  const { profiles } = useProfiles();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const options = useMemo<Profile[]>(() => {
    const filters: string[] = Array.isArray(cargoFilter)
      ? cargoFilter.map((c) => normalize(c))
      : cargoFilter
        ? [normalize(cargoFilter)]
        : [normalize(cargo)];

    const list = (profiles || []).filter((p: Profile) => {
      const raw = (p.cargo || p.role || "");
      const norm = normalize(raw);
      // Match if any filter equals or is contained in the normalized cargo string
      return filters.some((f) => norm === f || norm.includes(f));
    });
    if (!search) return list;
    const term = normalize(search);
    return list.filter((p: Profile) => {
      const name = normalize(p.full_name || p.display_name || "");
      const email = (p.email || "").toLowerCase(); // keep email case-insensitive only
      return name.includes(term) || email.includes(term);
    });
  }, [profiles, cargo, search]);

  const selected = useMemo<Profile | undefined>(() => (profiles || []).find((p: Profile) => p.id === value), [profiles, value]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Popover open={disabled ? false : open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2" disabled={disabled}>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              disabled={disabled}
            />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {options.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Nenhum profissional encontrado para {cargo}
                </div>
              ) : (
                options.map((p: Profile) => (
                  <Button
                    key={p.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => {
                      if (disabled) return;
                      onChange(p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    disabled={disabled}
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
                <Button variant="outline" size="sm" onClick={() => onChange(undefined)} disabled={disabled}>Remover seleção</Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}