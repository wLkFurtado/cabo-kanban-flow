import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para verificar se o usuário tem permissão para gerenciar a Agenda Institucional
 * Verifica se o usuário tem o scope 'agenda_institucional_admin' ou é admin
 */
export function useAgendaInstitucionalScope() {
  const { data: hasScope, isLoading } = useQuery({
    queryKey: ['agenda-institucional-scope'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      // Check if user has agenda_institucional_admin scope
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role, scopes')
        .eq('user_id', user.id)
        .maybeSingle();

      // Admin always has access
      if (userRole?.role === 'admin') return true;

      // Check for agenda_institucional_admin scope
      return userRole?.scopes?.includes('agenda_institucional_admin') ?? false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    hasScope: hasScope ?? false,
    isLoading,
  };
}
