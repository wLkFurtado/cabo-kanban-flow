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
      const res = await supabase
        .from('user_roles')
        .select('role, scopes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (res.error) throw res.error;
      type UserRoleRow = { role: AppRole | string; scopes: AdminScope[] | null };
      const rows: UserRoleRow[] = Array.isArray(res.data) ? (res.data as UserRoleRow[]) : [];
      const adminRow = rows.find((r) => r.role === 'admin');
      const chosen = adminRow ?? rows[0];
      const role = (chosen?.role ?? 'user') as AppRole;
      const scopes = Array.isArray(chosen?.scopes) ? (chosen!.scopes as AdminScope[]) : [];
      return { role, scopes } satisfies UserPermissions;
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
      const { error: insError } = await supabase
        .from('user_roles')
        .insert({ user_id: updates.userId, role: updates.role, scopes: updates.scopes });
      if (insError) throw insError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions', variables.userId] });
      toast({ title: 'Permissões atualizadas', description: 'As permissões do usuário foram salvas.' });
    },
    onError: (err: unknown) => {
      const message = typeof err === 'object' && err && 'message' in err ? String((err as any).message) : 'Tente novamente mais tarde.';
      toast({ title: 'Erro ao atualizar permissões', description: message });
    },
  });

  return {
    permissions: (data as UserPermissions | undefined),
    loading: isLoading,
    error,
    updatePermissions: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}