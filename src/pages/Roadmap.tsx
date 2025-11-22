import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { ThumbsUp, ThumbsDown, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import type { Database } from "../integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type RoadmapSuggestion = {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  pos_count?: number;
  neg_count?: number;
  pos_voters?: { id: string; name: string }[];
  neg_voters?: { id: string; name: string }[];
  user_vote?: "positive" | "negative" | null;
};

type RoadmapSuggestionRow = Database["public"]["Tables"]["roadmap_suggestions"]["Row"];
type RoadmapVoteRow = Database["public"]["Tables"]["roadmap_votes"]["Row"];

type RoadmapProps = {
  allowSubmit?: boolean;
  allowVoting?: boolean;
};

export default function Roadmap({ allowSubmit = false, allowVoting = false }: RoadmapProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Cast Supabase client to a relaxed generic to avoid deep type instantiation issues
  const sb = supabase as unknown as SupabaseClient<Database>;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersList, setVotersList] = useState<{ id: string; name: string }[]>([]);
  const [votersType, setVotersType] = useState<"pos" | "neg" | null>(null);
  const [votersSuggestionTitle, setVotersSuggestionTitle] = useState("");

  const openVoters = (
    type: "pos" | "neg",
    voters: { id: string; name: string }[],
    title: string
  ) => {
    setVotersType(type);
    setVotersList(voters);
    setVotersSuggestionTitle(title);
    setVotersOpen(true);
  };

  const { data: suggestions, isLoading, isError, error } = useQuery<RoadmapSuggestion[], Error>({
    queryKey: ["roadmap-suggestions"],
    queryFn: async () => {
      // Buscar sugestões
      const { data: suggestionsData, error: suggestionsError } = await (sb as any)
        .from("roadmap_suggestions")
        .select("id,title,description,user_id,created_at")
        .eq("status", "in_progress")
        .order("created_at", { ascending: false });
      if (suggestionsError) throw suggestionsError;
      const suggestionRows = (suggestionsData ?? []) as unknown as RoadmapSuggestionRow[];

      // Buscar todos os votos para agregação no cliente
      let votesRows: RoadmapVoteRow[] = [];
      const { data: votesData, error: votesError } = await sb
        .from("roadmap_votes")
        .select("suggestion_id,user_id,vote");
      if (votesError) {
        const msg = String(votesError.message || "");
        // Fallback: se a coluna 'vote' não existir ainda, buscar sem ela e assumir +1
        if (msg.includes("column roadmap_votes.vote does not exist")) {
          const { data: votesDataFallback, error: votesErrorFallback } = await sb
            .from("roadmap_votes")
            .select("suggestion_id,user_id");
          if (votesErrorFallback) throw votesErrorFallback;
          const fallbackRows = (votesDataFallback ?? []) as {
            suggestion_id: string;
            user_id: string;
          }[];
          votesRows = fallbackRows.map((v) => ({
            suggestion_id: v.suggestion_id,
            user_id: v.user_id,
            created_at: null,
            vote: 1,
          })) as RoadmapVoteRow[];
        } else {
          throw votesError;
        }
      } else {
        votesRows = (votesData ?? []) as RoadmapVoteRow[];
      }

      // Construir mapas de votantes por sugestão
      const posBySuggestion = new Map<string, string[]>();
      const negBySuggestion = new Map<string, string[]>();
      const voterIds = new Set<string>();
      votesRows.forEach((v) => {
        if (v.vote === 1) {
          posBySuggestion.set(v.suggestion_id, [
            ...(posBySuggestion.get(v.suggestion_id) || []),
            v.user_id,
          ]);
        } else {
          negBySuggestion.set(v.suggestion_id, [
            ...(negBySuggestion.get(v.suggestion_id) || []),
            v.user_id,
          ]);
        }
        voterIds.add(v.user_id);
      });

      // Map de perfil (id -> nome)
      let profileMap = new Map<string, { id: string; name: string }>();
      if (voterIds.size > 0) {
        const { data: profilesData } = await sb
          .from("profiles")
          .select("id,display_name,full_name,email");
        const profiles = (profilesData ?? []) as Database["public"]["Tables"]["profiles"]["Row"][];
        profileMap = new Map(
          profiles.map((p) => [p.id, { id: p.id, name: p.display_name || p.full_name || p.email || "Usuário" }])
        );
      }

      // Voto do usuário atual por sugestão
      const userVotePolarity = new Map<string, "positive" | "negative">();
      if (user?.id) {
        votesRows
          .filter((v) => v.user_id === user.id)
          .forEach((v) => userVotePolarity.set(v.suggestion_id, v.vote === 1 ? "positive" : "negative"));
      }

      return suggestionRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        user_id: row.user_id,
        created_at: row.created_at ?? "",
        pos_count: (posBySuggestion.get(row.id) || []).length,
        neg_count: (negBySuggestion.get(row.id) || []).length,
        pos_voters: (posBySuggestion.get(row.id) || []).map((uid) => profileMap.get(uid) || { id: uid, name: uid }),
        neg_voters: (negBySuggestion.get(row.id) || []).map((uid) => profileMap.get(uid) || { id: uid, name: uid }),
        user_vote: userVotePolarity.get(row.id) ?? null,
      }));
    },
  });

  const addSuggestion = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("roadmap_suggestions").insert({
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

  const setVote = useMutation({
    mutationFn: async ({ suggestionId, vote }: { suggestionId: string; vote: 1 | -1 | null }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      try {
        if (vote === null) {
          const { error } = await supabase
            .from("roadmap_votes")
            .delete()
            .eq("suggestion_id", suggestionId)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
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
          throw new Error(
            "A coluna 'vote' ainda não existe. Aplique a migração para habilitar votos negativos."
          );
        }
        if (msg.toLowerCase().includes("schema cache")) {
          throw new Error(
            "O Supabase ainda não reconhece a coluna 'vote' (cache de schema). No SQL Editor execute: select pg_notify('pgrst','reload schema'); e recarregue a página."
          );
        }
        const details = [e?.details, e?.hint].filter(Boolean).join(" ");
        const enriched = [msg, details].filter(Boolean).join(" \u2014 ");
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
      // Log para inspeção de erros não padronizados
      console.error("Vote error:", err);
    },
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Roadmap</h1>
          <p className="text-muted-foreground">Sugira melhorias e vote nas ideias.</p>
        </div>
        {allowSubmit && (
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
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Descrição"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Carregando sugestões...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">
          {user?.id
            ? `Erro ao carregar sugestões: ${error?.message ?? 'Falha desconhecida'}`
            : 'Para visualizar e participar do roadmap, faça login.'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(suggestions || []).map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-lg">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{s.description || "Sem descrição"}</p>
              {allowVoting && (
                <div className="flex items-center gap-4">
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
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => openVoters("pos", s.pos_voters || [], s.title)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openVoters("pos", s.pos_voters || [], s.title);
                      }}
                      className="text-blue-700 text-sm font-medium cursor-pointer select-none"
                      title="Ver quem votou positivamente"
                    >
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
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => openVoters("neg", s.neg_voters || [], s.title)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openVoters("neg", s.neg_voters || [], s.title);
                      }}
                      className="text-red-700 text-sm font-medium cursor-pointer select-none"
                      title="Ver quem votou negativamente"
                    >
                      {s.neg_count ?? 0}
                    </span>
                  </div>
                </div>
              )}
              {null}
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={votersOpen} onOpenChange={setVotersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {votersType === "pos" ? "Votantes positivos" : votersType === "neg" ? "Votantes negativos" : "Votantes"}
            </DialogTitle>
            <DialogDescription>
              {votersSuggestionTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {votersList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum voto ainda.</p>
            ) : (
              <ul className="list-disc pl-5">
                {votersList.map((u) => (
                  <li key={u.id} className="text-sm">{u.name}</li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVotersOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}