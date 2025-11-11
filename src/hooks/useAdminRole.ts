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

        // Helper para detectar erro de coluna 'scopes' inexistente em user_roles
        const isScopesColumnError = (err: unknown) => {
          const msg = String((err as { message?: string })?.message || '');
          return msg.includes('scopes') && (msg.includes('column') || msg.includes('schema cache'));
        };

        type RoleRow = { role: string; scopes?: string[] | null };
        const isRoleRowArray = (arr: unknown[]): arr is RoleRow[] =>
          arr.every((r) => typeof r === 'object' && r !== null && 'role' in (r as Record<string, unknown>));

        if (error || !data) {
          // Fallback: query user_roles directly (RLS allows viewing own role)
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role, scopes')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (rolesError) {
            // Tentar novamente sem 'scopes' caso seja erro de coluna inexistente
            if (isScopesColumnError(rolesError)) {
              const { data: rolesNoScopes, error: fallbackErr } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);
              if (fallbackErr) {
                console.error('Error checking admin role (fallback no scopes):', fallbackErr);
                setIsAdmin(false);
                setScopes([]);
              } else {
                const rows: RoleRow[] = Array.isArray(rolesNoScopes) && isRoleRowArray(rolesNoScopes as unknown[])
                  ? (rolesNoScopes as unknown as RoleRow[])
                  : [];
                const chosen = rows.find((r) => r.role === 'admin') ?? rows[0];
                const role = (chosen?.role ?? 'user').toString();
                setIsAdmin(role === 'admin');
                setScopes([]);
              }
            } else {
              console.error('Error checking admin role (fallback):', rolesError);
              setIsAdmin(false);
              setScopes([]);
            }
          } else {
            const rows: RoleRow[] = Array.isArray(roles) && isRoleRowArray(roles as unknown[])
              ? (roles as unknown as RoleRow[])
              : [];
            const chosen = rows.find((r) => r.role === 'admin') ?? rows[0];
            const role = (chosen?.role ?? 'user').toString();
            const rowScopes = Array.isArray(chosen?.scopes) ? chosen!.scopes! : [];
            setIsAdmin(role === 'admin');
            setScopes(rowScopes);
          }
        } else {
          setIsAdmin(data === 'admin');
          // Buscar scopes separadamente, com fallback se a coluna não existir
          const { data: roles, error: rolesErr } = await supabase
            .from('user_roles')
            .select('role, scopes')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          if (rolesErr && isScopesColumnError(rolesErr)) {
            setScopes([]);
          } else {
            const rows: RoleRow[] = Array.isArray(roles) && isRoleRowArray(roles as unknown[])
              ? (roles as unknown as RoleRow[])
              : [];
            const chosen = rows.find((r) => r.role === 'admin') ?? rows[0];
            const rowScopes = Array.isArray(chosen?.scopes) ? chosen!.scopes! : [];
            setScopes(rowScopes);
          }
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