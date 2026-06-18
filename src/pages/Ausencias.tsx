import { useState } from "react";
import { useProfiles, type Profile } from "@/hooks/useProfiles";
import { useAbsences, type UserAbsence } from "@/hooks/useAbsences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, CalendarRange, Palmtree, UserX, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Seo } from "@/components/seo/Seo";

export default function Ausencias() {
  const { profiles } = useProfiles();
  const { absences, isLoading, createAbsence, deleteAbsence, isCreating } = useAbsences();

  // Form states
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [tipo, setTipo] = useState<"ferias" | "folga">("ferias");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUserId) {
      setError("Por favor, selecione um colaborador.");
      return;
    }
    if (!dataInicio) {
      setError("Por favor, informe a data de início.");
      return;
    }
    if (!dataFim) {
      setError("Por favor, informe a data de fim.");
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      setError("A data de início não pode ser posterior à data de término.");
      return;
    }

    try {
      await createAbsence({
        user_id: selectedUserId,
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        observacao: observacao || null,
      });

      // Reset form
      setSelectedUserId("");
      setDataInicio("");
      setDataFim("");
      setObservacao("");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar ausência.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ausência?")) {
      await deleteAbsence(id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      // Ajuste de fuso horário local para evitar que a data mude ao formatar
      const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return format(utcDate, "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  // Sort profiles alphabetically by name
  const sortedProfiles = [...profiles].sort((a, b) => {
    const nameA = a.full_name || a.display_name || "";
    const nameB = b.full_name || b.display_name || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-6">
      <Seo title="Controle de Férias e Folgas - Coordenadoria de Comunicação" />
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarRange className="h-8 w-8 text-primary" />
          Férias e Folgas
        </h1>
        <p className="text-muted-foreground">
          Gerencie o período de indisponibilidade dos colaboradores para evitar escalação em pautas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form para cadastrar */}
        <Card className="lg:col-span-1 shadow-md border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserX className="h-5 w-5 text-primary" />
              Lançar Ausência
            </CardTitle>
            <CardDescription>
              Selecione o colaborador e o período em que ele estará ausente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-md border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="colaborador">Colaborador *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="colaborador">
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sortedProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || p.display_name || "Usuário sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={(value: "ferias" | "folga") => setTipo(value)}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferias">🌴 Férias</SelectItem>
                    <SelectItem value="folga">💤 Folga</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Término *</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação / Justificativa</Label>
                <Textarea
                  id="observacao"
                  placeholder="Ex: Viagem de férias, folga compensatória pelo FDS..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Registrar Ausência
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de ausências cadastradas */}
        <Card className="lg:col-span-2 shadow-md border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Ausências Registradas
            </CardTitle>
            <CardDescription>
              Férias e folgas ativas e programadas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                Carregando registros...
              </div>
            ) : absences.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/20">
                <Palmtree className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="font-medium text-slate-600 dark:text-slate-400">Nenhuma ausência registrada</p>
                <p className="text-sm">Todos os colaboradores estão disponíveis no momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absences.map((abs) => {
                      const name = abs.profile?.full_name || abs.profile?.display_name || "Usuário";
                      const email = abs.profile?.email || "";
                      return (
                        <TableRow key={abs.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <TableCell className="font-medium py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={abs.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</span>
                                <span className="text-xs text-muted-foreground">{email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {abs.tipo === "ferias" ? (
                              <Badge variant="secondary" className="bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900 flex items-center gap-1 w-fit">
                                🌴 Férias
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 flex items-center gap-1 w-fit">
                                💤 Folga
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {formatDate(abs.data_inicio)} - {formatDate(abs.data_fim)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={abs.observacao || ""}>
                            {abs.observacao || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              onClick={() => handleDelete(abs.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
