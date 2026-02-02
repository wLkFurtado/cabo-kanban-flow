import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Equipment, CreateEquipmentInput, UpdateEquipmentInput, EquipmentWithActiveLoan } from '@/state/equipmentTypes';

export function useEquipments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os equipamentos com empréstimo ativo
  const equipmentsQuery = useQuery({
    queryKey: ['equipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          active_loan:equipment_loans!equipment_id(
            id,
            user_id,
            loaned_at,
            returned_at,
            loaned_by,
            notes,
            created_at,
            user:profiles!user_id(
              id,
              full_name,
              email
            ),
            loaned_by_user:profiles!loaned_by(
              id,
              full_name
            )
          )
        `)
        .is('active_loan.returned_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar array de active_loan em objeto único
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((equipment: any) => ({
        ...equipment,
        active_loan: equipment.active_loan?.[0] || null
      })) as EquipmentWithActiveLoan[];
    },
  });

  // Criar equipamento
  const createEquipmentMutation = useMutation({
    mutationFn: async (input: CreateEquipmentInput) => {
      const { data, error } = await supabase
        .from('equipments')
        .insert([{
          name: input.name,
          model: input.model,
          serial_number: input.serial_number,
          status: 'disponivel'
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Equipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast({
        title: 'Equipamento cadastrado',
        description: 'O equipamento foi adicionado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar equipamento
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEquipmentInput & { id: string }) => {
      const { data, error } = await supabase
        .from('equipments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Equipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast({
        title: 'Equipamento atualizado',
        description: 'As alterações foram salvas com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deletar equipamento
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast({
        title: 'Equipamento removido',
        description: 'O equipamento foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    equipments: equipmentsQuery.data || [],
    loading: equipmentsQuery.isLoading,
    error: equipmentsQuery.error,
    createEquipment: createEquipmentMutation.mutate,
    updateEquipment: updateEquipmentMutation.mutate,
    deleteEquipment: deleteEquipmentMutation.mutate,
    isCreating: createEquipmentMutation.isPending,
    isUpdating: updateEquipmentMutation.isPending,
    isDeleting: deleteEquipmentMutation.isPending,
  };
}
