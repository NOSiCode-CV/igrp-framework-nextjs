'use server';

import { MenuFormData } from '@/features/applications/types';
import { callApi } from '@/lib/api-client';

interface MenuQueryParams {
  applicationId?: number;
  name?: string;
  type?: string;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const validParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);

  return validParams.length > 0 ? `?${validParams.join('&')}` : '';
}

export async function getMenus(params?: MenuQueryParams) {
  const queryString = params
    ? buildQueryString(params as Record<string, string | number | undefined>)
    : '';

  return callApi<MenuFormData[]>(`/api/menus${queryString}`, {
    method: 'GET',
  });
}

export async function getMenuById(id: number) {
  if (!id) {
    throw new Error('Menu ID is required');
  }

  return callApi<MenuFormData>(`/api/menus/${id}`, {
    method: 'GET',
  });
}

export async function createMenu(menuData: Partial<MenuFormData>) {
  if (!menuData.name || !menuData.type || !menuData.applicationId) {
    throw new Error('Name, type, and application ID are required');
  }

  return callApi<MenuFormData>('/api/menus', {
    method: 'POST',
    body: JSON.stringify(menuData),
  });
}

export async function updateMenu(id: number, menuData: Partial<MenuFormData>) {
  if (!id) {
    throw new Error('Menu ID is required');
  }

  return callApi<MenuFormData>(`/api/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(menuData),
  });
}

export async function deleteMenu(id: number) {
  if (!id) {
    throw new Error('Menu ID is required');
  }

  return callApi<void>(`/api/menus/${id}`, {
    method: 'DELETE',
  });
}

export async function getMenusByApplication(applicationId: number) {
  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  return getMenus({ applicationId });
}

export async function getSubMenus(parentId: number) {
  if (!parentId) {
    throw new Error('Parent ID is required');
  }

  return callApi<MenuFormData[]>(`/api/menus?parentId=${parentId}`, {
    method: 'GET',
  });
}

export async function updateMenuPosition(id: number, position: number) {
  if (!id || position === undefined) {
    throw new Error('Menu ID and position are required');
  }
}

export async function updateMenuStatus(id: number, status: 'ACTIVE' | 'INACTIVE') {
  if (!id || !status) {
    throw new Error('Menu ID and status are required');
  }

  return callApi<MenuFormData>(`/api/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
