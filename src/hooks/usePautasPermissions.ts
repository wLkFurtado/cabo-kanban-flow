import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';
import { useAdminRole } from './useAdminRole';

/**
 * Hook para verificar se o usuário atual tem permissão para gerenciar pautas
 * (criar, editar, excluir)
 * 
 * Um usuário pode gerenciar pautas se:
 * - Tiver role 'admin' OU
 * - Tiver o scope 'pautas_admin'
 */
export function usePautasPermissions() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { permissions, loading } = usePermissions(user?.id);

  const hasPautasAdminScope = useMemo(() => {
    if (!permissions) return false;
    return permissions.scopes.includes('pautas_admin');
  }, [permissions]);

  const canManagePautas = useMemo(() => {
    return isAdmin || hasPautasAdminScope;
  }, [isAdmin, hasPautasAdminScope]);

  const canDelete = canManagePautas;
  const canEdit = canManagePautas;
  const canCreate = true; // Qualquer usuário autenticado pode criar

  return {
    canManagePautas,
    canDelete,
    canEdit,
    canCreate,
    hasPautasAdminScope,
    isAdmin,
    loading,
  };
}
