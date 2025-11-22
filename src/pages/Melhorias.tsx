import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import Roadmap from "./Roadmap";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminRole } from "../hooks/useAdminRole";
 

export default function Melhorias() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminRole();
  const sb = supabase;

  type Suggestion = {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    pos_count?: number;
    neg_count?: number;
    user_vote?: "positive" | "negative" | null;
  };

  const { data: proposed, isLoading } = useQuery<Suggestion[], Error>({
    queryKey: ["roadmap-suggestions", "proposed"],
    queryFn: async () => {
      const { data, error } = await (sb as any)
        .from("roadmap_suggestions")
        .select("id,title,description,created_at")
        .eq("status", "proposed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const suggestions = (data ?? []) as Array<{ id: string; title: string; description: string | null; created_at: string | null }>;

      // Buscar votos e agregar
      const ids = suggestions.map((s) => s.id);
      type VoteRow = { suggestion_id: string; user_id: string; vote: number | null };
      let votesRows: VoteRow[] = [];
      if (ids.length > 0) {
        const { data: votesData, error: votesError } = await sb
          .from("roadmap_votes")
          .select("suggestion_id,user_id,vote")
          .in("suggestion_id", ids);
        if (votesError) {
          const msg = String(votesError.message || "");
          if (msg.includes("column roadmap_votes.vote does not exist")) {
            const { data: votesFallback, error: votesFallbackError } = await sb
              .from("roadmap_votes")
              .select("suggestion_id,user_id")
              .in("suggestion_id", ids);
            if (votesFallbackError) throw votesFallbackError;
            const fallbackRows = (votesFallback ?? []) as { suggestion_id: string; user_id: string }[];
            votesRows = fallbackRows.map((v) => ({
              suggestion_id: v.suggestion_id,
              user_id: v.user_id,
              vote: 1,
            }));
          } else {
            throw votesError;
          }
        } else {
          votesRows = (votesData ?? []) as VoteRow[];
        }
      }

      const userId = user?.id;
      return suggestions.map((row) => {
        const votesFor = votesRows.filter((v) => v.suggestion_id === row.id);
        const pos = votesFor.filter((v) => v.vote === 1).length;
        const neg = votesFor.filter((v) => v.vote === -1).length;
        const my = userId ? votesFor.find((v) => v.user_id === userId) : undefined;
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          created_at: row.created_at ?? "",
          pos_count: pos,
          neg_count: neg,
          user_vote: my ? (my.vote === 1 ? "positive" : "negative") : null,
        } as Suggestion;
      });
    },
  });

  const addSuggestion = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { error } = await sb.from("roadmap_suggestions").insert({
        title,
        description,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-suggestions"] });
      toast({ title: "Sugestão adicionada", description: "Obrigado pela contribuição!" });
      setTitle("");
      setDescription("");
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Falha desconhecida";
      toast({ title: "Erro ao adicionar", description: msg, variant: "destructive" });
    },
  });

  const moveToRoadmap = useMutation({
    mutationFn: async (id: string) => {
      // Tipos gerados podem não incluir 'status' ainda; forçar payload amplo
      const patch = { status: "in_progress" } as any;
      const { error } = await sb
        .from("roadmap_suggestions")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-suggestions"] });
      toast({ title: "Sugestão movida", description: "Agora aparece no Roadmap." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Falha desconhecida";
      toast({ title: "Erro ao mover", description: msg, variant: "destructive" });
    },
  });

  const setVote = useMutation({
    mutationFn: async ({ suggestionId, vote }: { suggestionId: string; vote: 1 | -1 | null }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      try {
        if (vote === null) {
          const { error } = await sb
            .from("roadmap_votes")
            .delete()
            .eq("suggestion_id", suggestionId)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await sb
            .from("roadmap_votes")
            .upsert(
              { suggestion_id: suggestionId, user_id: user.id, vote },
              { onConflict: "suggestion_id,user_id" }
            );
          if (error) throw error;
        }
      } catch (err: unknown) {
        const e = err as { message?: string; details?: string; hint?: string } | undefined;
        const msg = String(e?.message || "");
        if (msg.includes("column roadmap_votes.vote does not exist")) {
          throw new Error("A coluna 'vote' ainda não existe. Aplique a migração para habilitar votos negativos.");
        }
        if (msg.toLowerCase().includes("schema cache")) {
          throw new Error("O Supabase ainda não reconhece a coluna 'vote' (cache de schema). No SQL Editor execute: select pg_notify('pgrst','reload schema'); e recarregue a página.");
        }
        const details = [e?.details, e?.hint].filter(Boolean).join(" ");
        const enriched = [msg, details].filter(Boolean).join(" — ");
        throw new Error(enriched || "Falha desconhecida ao votar");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-suggestions"] });
    },
    onError: (err: unknown) => {
      const raw = err as { message?: string } | undefined;
      const msg = raw?.message || (err instanceof Error ? err.message : "Falha desconhecida");
      toast({ title: "Erro ao votar", description: msg, variant: "destructive" });
      console.error("Vote error:", err);
    },
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sugestões de melhoria</h1>
          <p className="text-muted-foreground">Envie ideias e acompanhe o andamento no roadmap.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova sugestão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar sugestão</DialogTitle>
              <DialogDescription>Informe um título e descrição breve.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Título"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Descrição"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => addSuggestion.mutate({ title, description })} disabled={!title.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sugestoes">
        <TabsList>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="sugestoes" className="mt-4">
          <div className="space-y-4">
            {isLoading && (
              <Card><CardContent className="pt-6">Carregando sugestões…</CardContent></Card>
            )}
            {(proposed ?? []).map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle>{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{s.description}</p>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        aria-label="Votar positivo"
                        variant="outline"
                        className={
                          s.user_vote === "positive"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border-blue-600 text-blue-600 hover:bg-blue-50"
                        }
                        onClick={() => {
                          const next = s.user_vote === "positive" ? null : 1;
                          setVote.mutate({ suggestionId: s.id, vote: next as 1 | -1 | null });
                        }}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <span className="text-blue-700 text-sm font-medium select-none">
                        {s.pos_count ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        aria-label="Votar negativo"
                        variant="outline"
                        className={
                          s.user_vote === "negative"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        }
                        onClick={() => {
                          const next = s.user_vote === "negative" ? null : -1;
                          setVote.mutate({ suggestionId: s.id, vote: next as 1 | -1 | null });
                        }}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                      <span className="text-red-700 text-sm font-medium select-none">
                        {s.neg_count ?? 0}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button size="sm" onClick={() => moveToRoadmap.mutate(s.id)}>
                      Mover para Roadmap
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {(proposed && proposed.length === 0) && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma sugestão enviada ainda. Use “Nova sugestão” para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <Roadmap allowSubmit={false} allowVoting={false} />
        </TabsContent>
      </Tabs>
    </section>
  );
}