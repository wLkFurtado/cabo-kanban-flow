import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle, VehicleWithActiveLoan, CreateVehicleInput, UpdateVehicleInput } from '@/state/vehicleTypes';
import { toast } from 'sonner';

export function useVehicles() {
  const queryClient = useQueryClient();

  // Fetch all vehicles with their active loans
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async (): Promise<VehicleWithActiveLoan[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          active_loan:vehicle_loans!vehicle_id(
            *,
            user:profiles!user_id(
              id,
              full_name,
              email
            )
          )
        `)
        .order('name');

      if (error) throw error;

      // Filter only active loans (not returned yet)
      return (data || []).map(vehicle => ({
        ...vehicle,
        active_loan: vehicle.active_loan?.find((loan: any) => !loan.returned_at)
      }));
    },
  });

  // Create vehicle mutation
  const { mutate: createVehicle, isPending: isCreating } = useMutation({
    mutationFn: async (input: CreateVehicleInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          ...input,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Carro cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar carro: ' + error.message);
    },
  });

  // Update vehicle mutation
  const { mutate: updateVehicle, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...input }: UpdateVehicleInput) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Carro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar carro: ' + error.message);
    },
  });

  // Delete vehicle mutation
  const { mutate: deleteVehicle, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Carro excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir carro: ' + error.message);
    },
  });

  return {
    vehicles,
    isLoading,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
