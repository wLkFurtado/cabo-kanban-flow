import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { X, UserPlus } from "lucide-react";
import { useProfiles, type Profile } from "../../hooks/useProfiles";
import { useAbsences } from "../../hooks/useAbsences";
import { useToast } from "@/components/ui/use-toast";
import { getInitials } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface RoleUsersMultiSelectProps {
  label: string;
  cargoFilter?: string | string[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  pautaDate?: string | Date;
}

export function RoleUsersMultiSelect({ label, cargoFilter, selectedIds, onChange, disabled, pautaDate }: RoleUsersMultiSelectProps) {
  const { profiles } = useProfiles();
  const { absences } = useAbsences();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

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

  const candidates = useMemo(() => {
    const filterList = Array.isArray(cargoFilter)
      ? cargoFilter.map((c) => normalize(c))
      : cargoFilter
      ? [normalize(cargoFilter)]
      : [];
    return (profiles || []).filter((p: Profile) => {
      const name = (p.full_name || p.display_name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const cargo = normalize(p.cargo || p.role || "");
      const matchesSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      const matchesCargo = filterList.length === 0 || filterList.some((f) => cargo.includes(f));
      const notSelected = !selectedIds.includes(p.id);
      return matchesSearch && matchesCargo && notSelected;
    });
  }, [profiles, search, cargoFilter, selectedIds]);

  const addId = (id: string) => {
    if (disabled) return;
    
    const absence = checkUserAbsence(id, pautaDate);
    if (absence) {
      const user = (profiles || []).find((x) => x.id === id);
      const name = user?.full_name || user?.display_name || "Este colaborador";
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

    onChange([...selectedIds, id]);
    setSearch("");
    setOpen(false);
  };

  const removeId = (id: string) => {
    if (disabled) return;
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
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeId(id)} disabled={disabled}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      <Popover open={disabled ? false : open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={disabled}>
            <UserPlus className="h-4 w-4" /> Adicionar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div>
              <Label htmlFor={`${label}-search`}>Buscar</Label>
              <Input id={`${label}-search`} value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} placeholder="Nome, email..." className="mt-1" disabled={disabled} />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {candidates.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</div>
              ) : (
                candidates.map((p: Profile) => {
                  const absence = checkUserAbsence(p.id, pautaDate);
                  return (
                    <Button key={p.id} variant="ghost" className="w-full justify-start gap-3 h-auto p-3 text-left" onClick={() => addId(p.id)} disabled={disabled}>
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