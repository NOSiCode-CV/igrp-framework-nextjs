'use server';

import { Permission, PermissionRole } from '@/features/permission/types';
// import { callApi } from '@/lib/api-client';

export async function getAllPermissions() {
  // return callApi<Permission[]>('/api/permissions', {
  //   method: 'GET',
  // });
  return [];
}

export async function getPermissionsByApplication(appCode: string) {
  if (!appCode) {
    throw new Error('Application ID is required');
  }

  // return callApi<Permission[]>(`/api/permissions?applicationId=${applicationId}`, {
  //   method: 'GET',
  // });
  return [];
}

export async function getPermission(id: number) {
  if (!id) {
    throw new Error('Permission ID is required');
  }

  // return callApi<Permission>(`/api/permissions/${id}`, {
  //   method: 'GET',
  // });
  return {} as Permission;
}

export async function getPermissionRoles(permissionId: number) {
  if (!permissionId) {
    throw new Error('Permission ID is required');
  }

  // return callApi<PermissionRole[]>(`/api/permissions/${permissionId}/roles`, {
  //   method: 'GET',
  // });
  return [];
}

export async function createPermission(permissionData: Partial<Permission>) {
  if (!permissionData.name || !permissionData.applicationId) {
    throw new Error('Name and application ID are required');
  }

  // return callApi<Permission>('/api/permissions', {
  //   method: 'POST',
  //   body: JSON.stringify(permissionData),
  // });
  return {} as Permission;
}

export async function updatePermission(id: number, permissionData: Partial<Permission>) {
  if (!id) {
    throw new Error('Permission ID is required');
  }

  // return callApi<Permission>(`/api/permissions/${id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(permissionData),
  // });
  return {} as Permission;
}

export async function deletePermission(id: number) {
  if (!id) {
    throw new Error('Permission ID is required');
  }

  // return callApi<void>(`/api/permissions/${id}`, {
  //   method: 'DELETE',
  // });
  return null;
}
