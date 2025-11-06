import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFdsStore, weekendKeyFromDate, WeekendTeam } from "@/state/fdsStore";
import { RoleUserSelect } from "@/components/pautas/RoleUserSelect";
import { RoleUsersMultiSelect } from "@/components/fds/RoleUsersMultiSelect";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeekendTeamFormProps {
  weekendDate?: Date;
}

export function WeekendTeamForm({ weekendDate }: WeekendTeamFormProps) {
  const key = useMemo(() => (weekendDate ? weekendKeyFromDate(weekendDate) : undefined), [weekendDate]);
  const team = useFdsStore((s) => (key ? s.getTeam(key) : undefined));
  const updateRole = useFdsStore((s) => s.updateRole);

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
    updateRole(weekendKey, role, userId);
  };

  const handleMulti = (role: "jornalistas" | "tamoios", ids: string[]) => {
    updateRole(key, role, ids);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Equipe do FDS – {format(weekendDate, "dd/MM/yyyy", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Chefe de Plantão"
            cargo="chefe"
            value={team?.chefe}
            onChange={(id) => handleSingle("chefe", id || undefined)}
          />
          <RoleUsersMultiSelect
            label="Jornalistas"
            cargoFilter={["jornalista", "repórter"]}
            selectedIds={team?.jornalistas || []}
            onChange={(ids) => handleMulti("jornalistas", ids)}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Rede"
            cargo="rede"
            value={team?.rede}
            onChange={(id) => handleSingle("rede", id || undefined)}
          />
          <RoleUserSelect
            label="Fotógrafo"
            cargo="fotografo"
            value={team?.fotografo}
            onChange={(id) => handleSingle("fotografo", id || undefined)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Filmmaker"
            cargo="filmmaker"
            value={team?.filmmaker}
            onChange={(id) => handleSingle("filmmaker", id || undefined)}
          />
          <RoleUserSelect
            label="Edição"
            cargo="edicao"
            value={team?.edicao}
            onChange={(id) => handleSingle("edicao", id || undefined)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleUserSelect
            label="Designer"
            cargo="designer"
            value={team?.designer}
            onChange={(id) => handleSingle("designer", id || undefined)}
          />
          <RoleUsersMultiSelect
            label="Tamoios"
            cargoFilter={["tamoio", "apoio", "estagi"]}
            selectedIds={team?.tamoios || []}
            onChange={(ids) => handleMulti("tamoios", ids)}
          />
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            placeholder="Notas gerais para a equipe do final de semana"
            value={team?.notes || ""}
            onChange={(e) => updateRole(weekendKey, "notes", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}