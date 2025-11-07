import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { X, UserPlus } from "lucide-react";
import { useProfiles, type Profile } from "../../hooks/useProfiles";
import { getInitials } from "../../state/authStore";

interface RoleUsersMultiSelectProps {
  label: string;
  cargoFilter?: string | string[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function RoleUsersMultiSelect({ label, cargoFilter, selectedIds, onChange }: RoleUsersMultiSelectProps) {
  const { profiles } = useProfiles();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const candidates = useMemo(() => {
    const filterList = Array.isArray(cargoFilter) ? cargoFilter.map((c) => c.toLowerCase()) : cargoFilter ? [cargoFilter.toLowerCase()] : [];
    return (profiles || []).filter((p: Profile) => {
      const name = (p.full_name || p.display_name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const cargo = (p.cargo || "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      const matchesCargo = filterList.length === 0 || filterList.some((f) => cargo.includes(f));
      const notSelected = !selectedIds.includes(p.id);
      return matchesSearch && matchesCargo && notSelected;
    });
  }, [profiles, search, cargoFilter, selectedIds]);

  const addId = (id: string) => {
    onChange([...selectedIds, id]);
    setSearch("");
    setOpen(false);
  };

  const removeId = (id: string) => {
    onChange(selectedIds.filter((x: string) => x !== id));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id: string) => {
            const p = (profiles || []).find((x: Profile) => x.id === id);
            const name = p?.full_name || p?.display_name || "Usuário";
            return (
              <Badge key={id} variant="secondary" className="flex items-center gap-2 pr-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={p?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs">{name}</span>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeId(id)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Adicionar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div>
              <Label htmlFor={`${label}-search`}>Buscar</Label>
              <Input id={`${label}-search`} value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} placeholder="Nome, email..." className="mt-1" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {candidates.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</div>
              ) : (
                candidates.map((p: Profile) => (
                  <Button key={p.id} variant="ghost" className="w-full justify-start gap-3 h-auto p-3" onClick={() => addId(p.id)}>
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}