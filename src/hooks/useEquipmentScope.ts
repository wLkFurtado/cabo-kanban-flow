import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEquipmentScope() {
  const { data: hasScope, isLoading } = useQuery({
    queryKey: ['equipment-scope'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      // Check if user has equipments_admin scope
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role, scopes')
        .eq('user_id', user.id)
        .single();

      // Admin always has access
      if (userRole?.role === 'admin') return true;

      // Check for equipments_admin scope
      return userRole?.scopes?.includes('equipments_admin') ?? false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    hasEquipmentScope: hasScope ?? false,
    isLoading,
  };
}
