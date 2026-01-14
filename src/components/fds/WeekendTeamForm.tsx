import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { weekendKeyFromDate, WeekendTeam } from "../../state/fdsStore";
import { RoleUserSelect } from "../pautas/RoleUserSelect";
import { RoleUsersMultiSelect } from "./RoleUsersMultiSelect";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminRole } from "../../hooks/useAdminRole";
import { useWeekendTeam } from "../../hooks/useFdsTeams";
import { Loader2 } from "lucide-react";

interface WeekendTeamFormProps {
  weekendDate?: Date;
}

export function WeekendTeamForm({ weekendDate }: WeekendTeamFormProps) {
  const key = useMemo(() => (weekendDate ? weekendKeyFromDate(weekendDate) : undefined), [weekendDate]);
  const { team, isLoading, updateRole, isUpdating } = useWeekendTeam(key);
  const { isAdmin, hasScope } = useAdminRole();
  const canEdit = isAdmin || hasScope("escala_fds_admin");

  if (!weekendDate || !key) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecione uma data de fim de semana</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Clique em um sábado ou domingo no calendário ao lado.</p>
        </CardContent>
      </Card>
    );
  }

  const weekendKey = key as string;

  const handleSingle = (
    role: Exclude<keyof WeekendTeam, "jornalistas" | "tamoios" | "notes">,
    userId?: string
  ) => {
    updateRole(role, userId);
  };

  const handleMulti = (role: "jornalistas" | "tamoios", ids: string[]) => {
    updateRole(role, ids);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            Equipe do FDS – {format(weekendDate, "dd/MM/yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Equipe do FDS – {format(weekendDate, "dd/MM/yyyy", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canEdit && (
          <div className="text-sm text-muted-foreground">
            Edição restrita a administradores da Escala FDS.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Chefe de Plantão"
            cargo="chefe"
            cargoFilter={["chefe", "jornalista", "repórter"]}
            value={team?.chefe}
            onChange={(id: string | undefined) => handleSingle("chefe", id || undefined)}
            disabled={!canEdit}
          />
          <RoleUsersMultiSelect
            label="Jornalistas"
            cargoFilter={["jornalista", "repórter"]}
            selectedIds={team?.jornalistas || []}
            onChange={(ids: string[]) => handleMulti("jornalistas", ids)}
            disabled={!canEdit}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Rede"
            cargo="rede"
            value={team?.rede}
            onChange={(id: string | undefined) => handleSingle("rede", id || undefined)}
            disabled={!canEdit}
          />
          <RoleUserSelect
            label="Fotógrafo"
            cargo="fotografo"
            value={team?.fotografo}
            onChange={(id: string | undefined) => handleSingle("fotografo", id || undefined)}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Filmmaker"
            cargo="filmmaker"
            cargoFilter={["filmmaker", "cinematografista", "videomaker"]}
            value={team?.filmmaker}
            onChange={(id: string | undefined) => handleSingle("filmmaker", id || undefined)}
            disabled={!canEdit}
          />
          <RoleUserSelect
            label="Edição"
            cargo="edicao"
            cargoFilter={["filmmaker", "cinematografista", "videomaker", "editor", "edição"]}
            value={team?.edicao}
            onChange={(id: string | undefined) => handleSingle("edicao", id || undefined)}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Designer"
            cargo="designer"
            value={team?.designer}
            onChange={(id: string | undefined) => handleSingle("designer", id || undefined)}
            disabled={!canEdit}
          />
          <RoleUsersMultiSelect
            label="Tamoios"
            cargoFilter={["tamoio", "apoio", "estagi", "rede"]}
            selectedIds={team?.tamoios || []}
            onChange={(ids: string[]) => handleMulti("tamoios", ids)}
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            placeholder="Notas gerais para a equipe do final de semana"
            value={team?.notes || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateRole("notes", e.target.value)}
            disabled={!canEdit || isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
}