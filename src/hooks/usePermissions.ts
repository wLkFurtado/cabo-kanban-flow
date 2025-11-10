import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { useAdminRole } from './useAdminRole';

export type AdminScope = 'pautas_admin' | 'escala_fds_admin';
export type AppRole = 'admin' | 'user' | 'guest';

export interface UserPermissions {
  role: AppRole;
  scopes: AdminScope[];
}

export function usePermissions(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();

  const { data, isLoading, error } = useQuery({
    queryKey: ['permissions', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('userId é obrigatório');
      const wants = 'role, scopes';
      const fetchRoles = async (columns: string) =>
        supabase
          .from('user_roles')
          .select(columns)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
      const res = await fetchRoles(wants);
      const isScopesColumnError = (msg: string) => {
        const m = msg.toLowerCase();
        return m.includes('scopes') && (m.includes('column') || m.includes('schema cache'));
      };
      if (res.error) {
        const msg = String(res.error.message || '');
        if (isScopesColumnError(msg)) {
          // Fallback sem coluna scopes
          const resNoScopes = await fetchRoles('role');
          if (resNoScopes.error) throw resNoScopes.error;
          type UserRoleRowNoScopes = { role: AppRole | string };
          const isRows = (arr: unknown[]): arr is UserRoleRowNoScopes[] =>
            arr.every((r) => typeof r === 'object' && r !== null && 'role' in (r as Record<string, unknown>));
          const rows: UserRoleRowNoScopes[] = Array.isArray(resNoScopes.data) && isRows(resNoScopes.data) ? resNoScopes.data : [];
          const adminRow = rows.find((r) => r.role === 'admin');
          const chosen = adminRow ?? rows[0];
          const role = (chosen?.role ?? 'user') as AppRole;
          const scopes: AdminScope[] = [];
          return { role, scopes } satisfies UserPermissions;
        }
        throw res.error;
      }
      type UserRoleRow = { role: AppRole | string; scopes: AdminScope[] | null };
      const isUserRoleRowArray = (arr: unknown[]): arr is UserRoleRow[] =>
        arr.every((r) => typeof r === 'object' && r !== null && 'role' in (r as Record<string, unknown>));
      const rows: UserRoleRow[] = Array.isArray(res.data) && isUserRoleRowArray(res.data) ? res.data : [];
      const adminRow = rows.find((r) => r.role === 'admin');
      const chosen = adminRow ?? rows[0];
      const role = (chosen?.role ?? 'user') as AppRole;
      const scopes = Array.isArray(chosen?.scopes) ? (chosen!.scopes as AdminScope[]) : [];
      return { role, scopes } satisfies UserPermissions;
    },
  });

  // Feature detection: verificar se a coluna 'scopes' existe em user_roles
  const { data: hasScopesColumn } = useQuery({
    queryKey: ['user_roles_scopes_column_support'],
    queryFn: async () => {
      const res = await supabase
        .from('user_roles')
        .select('scopes')
        .limit(1);
      if (res.error) {
        const msg = String(res.error.message || '').toLowerCase();
        // PostgREST costuma retornar mensagem indicando coluna não encontrada ou ausente no cache
        const notFound = msg.includes('scopes') && (msg.includes('column') || msg.includes('schema cache'));
        return !notFound ? true : false;
      }
      return true;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: UserPermissions & { userId: string }) => {
      if (!isAdmin) throw new Error('Apenas administradores podem alterar permissões');
      // Replace existing role rows to avoid ambiguity
      const { error: delError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', updates.userId);
      if (delError) throw delError;

      // Inserção condicional conforme suporte à coluna 'scopes'
      if (hasScopesColumn) {
        const { error: insError } = await supabase
          .from('user_roles')
          .insert({ user_id: updates.userId, role: updates.role, scopes: updates.scopes });
        if (insError) throw insError;
      } else {
        const { error: insErrorNoScopes } = await supabase
          .from('user_roles')
          .insert({ user_id: updates.userId, role: updates.role });
        if (insErrorNoScopes) throw insErrorNoScopes;
        throw new Error("Permissões granulares (scopes) indisponíveis: aplique a migração 'add_user_roles_scopes'.");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions', variables.userId] });
      toast({ title: 'Permissões atualizadas', description: 'As permissões do usuário foram salvas.' });
    },
    onError: (err: unknown) => {
      let message = 'Tente novamente mais tarde.';
      if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        if (typeof m === 'string') message = m;
      }
      toast({ title: 'Erro ao atualizar permissões', description: message });
    },
  });

  return {
    permissions: (data as UserPermissions | undefined),
    loading: isLoading,
    error,
    updatePermissions: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    hasScopesColumn: !!hasScopesColumn,
  };
}