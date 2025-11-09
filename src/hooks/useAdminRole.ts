import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useAdminRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setScopes([]);
        setLoading(false);
        return;
      }

      // Evita chamadas quando offline
      if (!isOnline) {
        setIsAdmin(false);
        setScopes([]);
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
            .select('role, scopes')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (rolesError) {
            console.error('Error checking admin role (fallback):', rolesError);
            setIsAdmin(false);
            setScopes([]);
          } else {
            const adminRow = (roles || []).find((r: any) => r.role === 'admin');
            const chosen = adminRow ?? (roles || [])[0];
            const role = chosen?.role ?? 'user';
            const rowScopes = Array.isArray(chosen?.scopes) ? chosen.scopes : [];
            setIsAdmin(role === 'admin');
            setScopes(rowScopes);
          }
        } else {
          setIsAdmin(data === 'admin');
          // Fetch scopes separately
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role, scopes')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          const adminRow = (roles || []).find((r: any) => r.role === 'admin');
          const chosen = adminRow ?? (roles || [])[0];
          const rowScopes = Array.isArray(chosen?.scopes) ? chosen.scopes : [];
          setScopes(rowScopes);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        setScopes([]);
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [user, isOnline]);

  const hasScope = useMemo(() => {
    return (scope: string) => isAdmin || scopes.includes(scope);
  }, [isAdmin, scopes]);

  return { isAdmin, scopes, hasScope, loading };
}