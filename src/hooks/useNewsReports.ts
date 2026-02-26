import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface NewsReport {
  id: number;
  external_id: number | null;
  titulo: string;
  data: string;
  link: string | null;
  categorias: string | null;
  autor: string | null;
  mes_referencia: string;
  created_at: string;
}

export interface ImportReportInput {
  external_id?: number | null;
  titulo: string;
  data: string;
  link?: string | null;
  categorias?: string | null;
  autor?: string | null;
  mes_referencia: string;
}

export function useNewsReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['news-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_reports')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      return (data || []) as NewsReport[];
    },
  });

  const importReportsMutation = useMutation({
    mutationFn: async (reports: ImportReportInput[]) => {
      // Insert in batches of 500 to avoid payload limits
      const batchSize = 500;
      for (let i = 0; i < reports.length; i += batchSize) {
        const batch = reports.slice(i, i + batchSize);
        const { error } = await supabase
          .from('news_reports')
          .insert(batch);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-reports'] });
      toast({
        title: 'Importação concluída',
        description: 'Os dados da planilha foram importados com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao importar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteByMonthMutation = useMutation({
    mutationFn: async (mesReferencia: string) => {
      const { error } = await supabase
        .from('news_reports')
        .delete()
        .eq('mes_referencia', mesReferencia);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-reports'] });
      toast({
        title: 'Dados removidos',
        description: 'Os dados do mês selecionado foram removidos.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover dados',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    reports: reportsQuery.data || [],
    loading: reportsQuery.isLoading,
    error: reportsQuery.error,
    importReports: importReportsMutation.mutateAsync,
    isImporting: importReportsMutation.isPending,
    deleteByMonth: deleteByMonthMutation.mutate,
    isDeleting: deleteByMonthMutation.isPending,
  };
}
