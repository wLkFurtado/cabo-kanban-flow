import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVehicleScope() {
  const { data: hasScope, isLoading } = useQuery({
    queryKey: ['vehicle-scope'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      // Check if user has vehicles_admin scope
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role, scopes')
        .eq('user_id', user.id)
        .single();

      // Admin always has access
      if (userRole?.role === 'admin') return true;

      // Check for vehicles_admin scope
      return userRole?.scopes?.includes('vehicles_admin') ?? false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    hasVehicleScope: hasScope ?? false,
    isLoading,
  };
}
