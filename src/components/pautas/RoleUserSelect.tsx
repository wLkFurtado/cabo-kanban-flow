import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { useProfiles } from "../../hooks/useProfiles";
import type { Profile } from "../../hooks/useProfiles";
import { useAbsences } from "../../hooks/useAbsences";
import { useToast } from "@/components/ui/use-toast";
import { getInitials } from "@/lib/utils";
import { cn } from "../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface RoleUserSelectProps {
  label: string;
  cargo: string;
  cargoFilter?: string | string[];
  value?: string;
  onChange: (userId?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  pautaDate?: string | Date;
}

export function RoleUserSelect({ label, cargo, cargoFilter, value, onChange, placeholder, className, disabled, pautaDate }: RoleUserSelectProps) {
  const { profiles } = useProfiles();
  const { absences } = useAbsences();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const checkUserAbsence = (userId: string, targetDateStr?: string | Date) => {
    if (!targetDateStr) return null;
    
    let targetDate: Date;
    if (typeof targetDateStr === "string") {
      targetDate = new Date(targetDateStr.split("T")[0] + "T12:00:00");
    } else {
      targetDate = new Date(targetDateStr);
      targetDate.setHours(12, 0, 0, 0);
    }
    
    return absences.find((abs) => {
      if (abs.user_id !== userId) return false;
      const start = new Date(abs.data_inicio + "T00:00:00");
      const end = new Date(abs.data_fim + "T23:59:59");
      return targetDate >= start && targetDate <= end;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

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
  }, [profiles, cargo, cargoFilter, search]);

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
        <PopoverContent className="w-80 pointer-events-auto" align="start">
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
                options.map((p: Profile) => {
                  const absence = checkUserAbsence(p.id, pautaDate);
                  return (
                    <Button
                      key={p.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto p-3 text-left"
                      onClick={() => {
                        if (disabled) return;
                        if (absence) {
                          const name = p.full_name || p.display_name || "Este colaborador";
                          setAlertMessage(
                            `${name} está de ${
                              absence.tipo === "ferias" ? "Férias" : "Folga"
                            } no período de ${formatDate(absence.data_inicio)} a ${formatDate(absence.data_fim)}.${
                              absence.observacao ? `\n\nMotivo/Justificativa: ${absence.observacao}` : ""
                            }`
                          );
                          setAlertOpen(true);
                          return;
                        }
                        onChange(p.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      disabled={disabled}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(p.full_name || p.display_name || "Usuário")}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-sm font-medium truncate">{p.full_name || p.display_name || "Usuário"}</span>
                          {absence && (
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 flex-shrink-0 ${
                              absence.tipo === "ferias"
                                ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                            }`}>
                              {absence.tipo === "ferias" ? "🌴 Férias" : "💤 Folga"}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate w-full">{p.email || ""}</span>
                      </div>
                    </Button>
                  );
                })
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

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              ⚠️ Colaborador Indisponível
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700 dark:text-slate-300 text-base whitespace-pre-line pt-2">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}