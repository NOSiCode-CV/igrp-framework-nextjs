import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  addRolePermissions,
  removeRolePermissions,
} from '@/actions/roles';
import { Role } from '@/features/roles/types';

export const useAllRoles = () => {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: getAllRoles,
  });
};

export const useRole = (id: number) => {
  return useQuery<Role>({
    queryKey: ['roles', id],
    queryFn: () => getRole(id),
    enabled: !!id,
  });
};

export const useAddRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleData: Partial<Role>) => createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Role> }) => updateRole(id, data),
    onSuccess: (updatedRole, variables) => {
      queryClient.setQueryData(['roles', variables.id], updatedRole);

      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ['roles', deletedId] });

      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useRolePermissions = (roleId: number) => {
  return useQuery({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: () => getRolePermissions(roleId),
    enabled: !!roleId,
  });
};

export const useAddRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: any[] }) =>
      addRolePermissions(roleId, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['roles', variables.roleId, 'permissions'],
      });
    },
  });
};

export const useRemoveRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: any[] }) =>
      removeRolePermissions(roleId, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['roles', variables.roleId, 'permissions'],
      });
    },
  });
};
