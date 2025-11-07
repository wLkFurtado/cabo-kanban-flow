import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useAdminRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Evita chamadas quando offline
      if (!isOnline) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Try RPC first
        const { data, error } = await supabase.rpc('get_current_user_role');

        if (error || !data) {
          // Fallback: query user_roles directly (RLS allows viewing own role)
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .limit(1);

          if (rolesError) {
            console.error('Error checking admin role (fallback):', rolesError);
            setIsAdmin(false);
          } else {
            const role = roles?.[0]?.role ?? 'user';
            setIsAdmin(role === 'admin');
          }
        } else {
          setIsAdmin(data === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [user, isOnline]);

  return { isAdmin, loading };
}