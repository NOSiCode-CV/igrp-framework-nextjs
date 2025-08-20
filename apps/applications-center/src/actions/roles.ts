'use server';

import { Permission, Role } from '@/features/roles/types';
import { callApi } from '@/lib/api-client';

export async function getAllRoles() {
  return callApi<Role[]>('/api/roles');
}

export async function getRole(id: number) {
  if (!id) {
    throw new Error('Role ID is required');
  }

  return callApi<Role>(`/api/roles/${id}`);
}

export async function createRole(roleData: Partial<Role>) {
  if (!roleData.name || !roleData.departmentId) {
    throw new Error('Name and department ID are required');
  }

  return callApi<Role>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(roleData),
  });
}

export async function updateRole(id: number, roleData: Partial<Role>) {
  if (!id) {
    throw new Error('Role ID is required');
  }

  return callApi<Role>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(roleData),
  });
}

export async function deleteRole(id: number) {
  if (!id) {
    throw new Error('Role ID is required');
  }

  return callApi<void>(`/api/roles/${id}`, {
    method: 'DELETE',
  });
}

export async function getRolePermissions(roleId: number) {
  if (!roleId) {
    throw new Error('Role ID is required');
  }

  return callApi<Permission[]>(`/api/roles/${roleId}/permissions`);
}

export async function addRolePermissions(roleId: number, permissions: string[]) {
  if (!roleId) {
    throw new Error('Role ID is required');
  }

  if (!permissions || permissions.length === 0) {
    throw new Error('Permissions are required');
  }

  return callApi<void>(`/api/roles/${roleId}/addPermissions`, {
    method: 'POST',
    body: JSON.stringify(permissions),
  });
}

export async function removeRolePermissions(roleId: number, permissions: string[]) {
  if (!roleId) {
    throw new Error('Role ID is required');
  }

  if (!permissions || permissions.length === 0) {
    throw new Error('Permissions are required');
  }

  return callApi<void>(`/api/roles/${roleId}/removePermissions`, {
    method: 'POST',
    body: JSON.stringify(permissions),
  });
}
