import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WeekendTeam } from "@/state/fdsStore";
import { useEffect } from "react";

interface WeekendTeamRow {
  id: string;
  weekend_key: string;
  chefe: string | null;
  rede: string | null;
  fotografo: string | null;
  filmmaker: string | null;
  edicao: string | null;
  designer: string | null;
  jornalistas: string[];
  tamoios: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Convert database row to WeekendTeam
function rowToTeam(row: WeekendTeamRow): WeekendTeam {
  return {
    chefe: row.chefe || undefined,
    rede: row.rede || undefined,
    fotografo: row.fotografo || undefined,
    filmmaker: row.filmmaker || undefined,
    edicao: row.edicao || undefined,
    designer: row.designer || undefined,
    jornalistas: row.jornalistas || [],
    tamoios: row.tamoios || [],
    notes: row.notes || undefined,
  };
}

// Convert WeekendTeam to database insert/update format
function teamToRow(team: WeekendTeam, weekendKey: string) {
  return {
    weekend_key: weekendKey,
    chefe: team.chefe || null,
    rede: team.rede || null,
    fotografo: team.fotografo || null,
    filmmaker: team.filmmaker || null,
    edicao: team.edicao || null,
    designer: team.designer || null,
    jornalistas: team.jornalistas || [],
    tamoios: team.tamoios || [],
    notes: team.notes || null,
  };
}

export function useFdsTeams() {
  const queryClient = useQueryClient();

  // Fetch all weekend teams
  const { data: teams = {}, isLoading } = useQuery({
    queryKey: ["weekend-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekend_teams" as any)
        .select("*")
        .order("weekend_key", { ascending: true });

      if (error) throw error;

      // Convert to Record<string, WeekendTeam>
      const teamsMap: Record<string, WeekendTeam> = {};
      (data as any)?.forEach((row: WeekendTeamRow) => {
        teamsMap[row.weekend_key] = rowToTeam(row);
      });

      return teamsMap;
    },
  });

  // Upsert (create or update) a weekend team
  const upsertTeam = useMutation({
    mutationFn: async ({
      weekendKey,
      team,
    }: {
      weekendKey: string;
      team: WeekendTeam;
    }) => {
      const row = teamToRow(team, weekendKey);

      const { data, error } = await supabase
        .from("weekend_teams" as any)
        .upsert(row, {
          onConflict: "weekend_key",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekend-teams"] });
    },
  });

  // Update a specific role in a weekend team
  const updateRole = useMutation({
    mutationFn: async <K extends keyof WeekendTeam>({
      weekendKey,
      role,
      value,
    }: {
      weekendKey: string;
      role: K;
      value: WeekendTeam[K];
    }) => {
      // First get current team or use empty
      const currentTeam = teams[weekendKey] || {
        jornalistas: [],
        tamoios: [],
      };

      // Update the specific role
      const updatedTeam = { ...currentTeam, [role]: value };

      // Upsert to database
      const row = teamToRow(updatedTeam, weekendKey);

      const { data, error } = await supabase
        .from("weekend_teams" as any)
        .upsert(row, {
          onConflict: "weekend_key",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekend-teams"] });
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("weekend_teams_changes")
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "weekend_teams",
        },
        () => {
          // Invalidate query to refetch data
          queryClient.invalidateQueries({ queryKey: ["weekend-teams"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    teams,
    isLoading,
    upsertTeam: upsertTeam.mutate,
    updateRole: updateRole.mutate,
    isUpdating: upsertTeam.isPending || updateRole.isPending,
  };
}

// Get a specific weekend team
export function useWeekendTeam(weekendKey: string | undefined) {
  const { teams, isLoading, updateRole, isUpdating } = useFdsTeams();

  const team =
    weekendKey && teams[weekendKey]
      ? teams[weekendKey]
      : { jornalistas: [], tamoios: [] };

  return {
    team,
    isLoading,
    updateRole: <K extends keyof WeekendTeam>(role: K, value: WeekendTeam[K]) => {
      if (weekendKey) {
        updateRole({ weekendKey, role, value });
      }
    },
    isUpdating,
  };
}
