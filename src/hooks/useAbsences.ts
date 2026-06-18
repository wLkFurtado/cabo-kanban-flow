import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface UserAbsence {
  id: string;
  user_id: string;
  tipo: "ferias" | "folga";
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  observacao: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function useAbsences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: absences = [], isLoading } = useQuery<UserAbsence[]>({
    queryKey: ["user-absences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_absences" as any)
        .select(`
          *,
          profile:profiles!user_absences_user_id_fkey(
            id,
            full_name,
            display_name,
            email,
            avatar_url
          )
        `)
        .order("data_inicio", { ascending: false });

      if (error) {
        console.error("Error fetching absences:", error);
        throw error;
      }
      return data as unknown as UserAbsence[];
    },
  });

  const createAbsence = useMutation({
    mutationFn: async (newAbsence: Omit<UserAbsence, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("user_absences" as any)
        .insert([newAbsence])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-absences"] });
      toast({
        title: "Ausência cadastrada",
        description: "As férias/folga foram registradas com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar ausência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAbsence = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserAbsence> & { id: string }) => {
      const { data, error } = await supabase
        .from("user_absences" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-absences"] });
      toast({
        title: "Ausência atualizada",
        description: "As informações da ausência foram salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar ausência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAbsence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_absences" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-absences"] });
      toast({
        title: "Ausência excluída",
        description: "O registro de férias/folga foi removido.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir ausência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("user_absences_changes")
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "user_absences",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-absences"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    absences,
    isLoading,
    createAbsence: createAbsence.mutateAsync,
    updateAbsence: updateAbsence.mutateAsync,
    deleteAbsence: deleteAbsence.mutateAsync,
    isCreating: createAbsence.isPending,
    isUpdating: updateAbsence.isPending,
    isDeleting: deleteAbsence.isPending,
  };
}
