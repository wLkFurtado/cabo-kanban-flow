import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';
import type { EquipmentLoan, CreateLoanInput, EquipmentLoanWithUser } from '@/state/equipmentTypes';

export function useEquipmentLoans() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os empréstimos com informações do usuário
  const loansQuery = useQuery({
    queryKey: ['equipment-loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_loans')
        .select(`
          *,
          user:profiles!user_id(
            id,
            full_name,
            email
          ),
          loaned_by_user:profiles!loaned_by(
            id,
            full_name
          ),
          returned_by_user:profiles!returned_by(
            id,
            full_name
          )
        `)
        .order('loaned_at', { ascending: false });

      if (error) throw error;
      return data as EquipmentLoanWithUser[];
    },
  });

  // Emprestar equipamento
  const loanEquipmentMutation = useMutation({
    mutationFn: async (input: CreateLoanInput) => {
      // Primeiro, atualizar status do equipamento
      const { error: updateError } = await supabase
        .from('equipments')
        .update({ status: 'emprestado' })
        .eq('id', input.equipment_id);

      if (updateError) throw updateError;

      // Depois, criar registro de empréstimo
      const { data, error } = await supabase
        .from('equipment_loans')
        .insert([{
          equipment_id: input.equipment_id,
          user_id: input.user_id,
          loaned_by: user?.id,
          notes: input.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as EquipmentLoan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-loans'] });
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast({
        title: 'Equipamento emprestado',
        description: 'O empréstimo foi registrado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao emprestar equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Devolver equipamento
  const returnEquipmentMutation = useMutation({
    mutationFn: async (loanId: string) => {
      // Buscar o empréstimo para pegar o equipment_id
      const { data: loan, error: loanError } = await supabase
        .from('equipment_loans')
        .select('equipment_id')
        .eq('id', loanId)
        .single();

      if (loanError) throw loanError;

      // Atualizar data de devolução e quem devolveu
      const { error: updateLoanError } = await supabase
        .from('equipment_loans')
        .update({ 
          returned_at: new Date().toISOString(),
          returned_by: user?.id
        })
        .eq('id', loanId);

      if (updateLoanError) throw updateLoanError;

      // Atualizar status do equipamento para disponível
      const { error: updateEquipmentError } = await supabase
        .from('equipments')
        .update({ status: 'disponivel' })
        .eq('id', loan.equipment_id);

      if (updateEquipmentError) throw updateEquipmentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-loans'] });
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast({
        title: 'Equipamento devolvido',
        description: 'A devolução foi registrada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao devolver equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Funções de filtro
  const getActiveLoans = () => {
    return loansQuery.data?.filter(loan => !loan.returned_at) || [];
  };

  const getLoanHistory = (equipmentId?: string, userId?: string) => {
    let filtered = loansQuery.data || [];
    
    if (equipmentId) {
      filtered = filtered.filter(loan => loan.equipment_id === equipmentId);
    }
    
    if (userId) {
      filtered = filtered.filter(loan => loan.user_id === userId);
    }
    
    return filtered;
  };

  return {
    loans: loansQuery.data || [],
    loading: loansQuery.isLoading,
    error: loansQuery.error,
    loanEquipment: loanEquipmentMutation.mutate,
    returnEquipment: returnEquipmentMutation.mutateAsync,
    isLoaning: loanEquipmentMutation.isPending,
    isReturning: returnEquipmentMutation.isPending,
    getActiveLoans,
    getLoanHistory,
  };
}
