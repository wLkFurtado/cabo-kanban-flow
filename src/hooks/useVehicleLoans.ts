import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleLoan, CreateVehicleLoanInput, ReturnVehicleInput } from '@/state/vehicleTypes';
import { toast } from 'sonner';

export function useVehicleLoans() {
  const queryClient = useQueryClient();

  // Fetch all vehicle loans with related data
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['vehicle-loans'],
    queryFn: async (): Promise<VehicleLoan[]> => {
      const { data, error } = await supabase
        .from('vehicle_loans')
        .select(`
          *,
          vehicle:vehicles!vehicle_id(*),
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
      return data || [];
    },
  });

  // Loan vehicle mutation
  const { mutate: loanVehicle, isPending: isLoaning } = useMutation({
    mutationFn: async (input: CreateVehicleLoanInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('vehicle_loans')
        .insert([{
          ...input,
          loaned_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update vehicle status to 'emprestado'
      await supabase
        .from('vehicles')
        .update({ status: 'emprestado' })
        .eq('id', input.vehicle_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-loans'] });
      toast.success('Carro em uso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao emprestar carro: ' + error.message);
    },
  });

  // Return vehicle mutation
  const { mutate: returnVehicle, isPending: isReturning } = useMutation({
    mutationFn: async ({ loanId, input }: { loanId: string; input: ReturnVehicleInput }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get loan to get vehicle_id
      const { data: loan } = await supabase
        .from('vehicle_loans')
        .select('vehicle_id, km_inicial')
        .eq('id', loanId)
        .single();

      if (!loan) throw new Error('Empréstimo não encontrado');

      // Validate km_final >= km_inicial
      if (input.km_final < loan.km_inicial) {
        throw new Error('A quilometragem final deve ser maior ou igual à inicial');
      }

      const { data, error } = await supabase
        .from('vehicle_loans')
        .update({
          km_final: input.km_final,
          returned_at: new Date().toISOString(),
          returned_by: user?.id,
          notes: input.notes,
        })
        .eq('id', loanId)
        .select()
        .single();

      if (error) throw error;

      // Update vehicle status back to 'disponivel'
      await supabase
        .from('vehicles')
        .update({ status: 'disponivel' })
        .eq('id', loan.vehicle_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-loans'] });
      toast.success('Carro devolvido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao devolver carro: ' + error.message);
    },
  });

  // Get loan history for a specific vehicle
  const getLoanHistory = (vehicleId: string): VehicleLoan[] => {
    return loans.filter(loan => loan.vehicle_id === vehicleId);
  };

  return {
    loans,
    isLoading,
    loanVehicle,
    returnVehicle,
    isLoaning,
    isReturning,
    getLoanHistory,
  };
}
