import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient, type PostgrestError } from "@supabase/supabase-js";
import { Comment } from "@/state/kanbanTypes";

interface RawActivity {
  id: string;
  board_id: string;
  card_id: string;
  user_id: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

export function useActivities(cardId: string) {
  const sb = supabase as SupabaseClient;
  const query = useQuery({
    queryKey: ["card-activities", cardId],
    queryFn: async () => {
      const { data, error } = await sb
        .from("card_activities")
        .select(
          `id, board_id, card_id, user_id, type, description, metadata, created_at`
        )
        .eq("card_id", cardId)
        .order("created_at", { ascending: false });

      // Se a tabela não existir ainda, retornar lista vazia para evitar quebra do app
      if (error) {
        const err = error as PostgrestError;
        const code = err?.code;
        const msg = err?.message ?? "";
        if (code === "42P01" || /relation\s+"?public\.card_activities"?\s+does\s+not\s+exist/i.test(msg)) {
          return [] as Comment[];
        }
        throw error;
      }

      const list = (data || []) as unknown as RawActivity[];

      // Buscar perfis dos usuários envolvidos nestas atividades
      const userIds = Array.from(new Set(list.map((a) => a.user_id).filter(Boolean)));
      let profilesMap: Record<string, ProfileRow> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await sb
          .from("profiles")
          .select("id, full_name, display_name, avatar_url")
          .in("id", userIds);
        if (!profilesError && profiles) {
          profilesMap = (profiles as unknown as ProfileRow[]).reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, ProfileRow>);
        }
      }

      const mapped: Comment[] = list.map((a) => {
        const prof = profilesMap[a.user_id];
        return {
          id: a.id,
          cardId: a.card_id,
          author: prof?.full_name || prof?.display_name || "Usuário",
          content: `${a.type}:${a.description}`,
          timestamp: a.created_at || new Date().toISOString(),
          type: "activity",
          avatarUrl: prof?.avatar_url || undefined,
        };
      });
      return mapped;
    },
    enabled: !!cardId,
  });

  // Assinatura realtime para atualizar atividades imediatamente em inserts/updates/deletes
  useEffect(() => {
    if (!cardId) return;
    const channel = sb
      .channel(`card-activities-${cardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "card_activities",
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          // Refetch para manter lista consistente com o servidor
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [cardId]);

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}