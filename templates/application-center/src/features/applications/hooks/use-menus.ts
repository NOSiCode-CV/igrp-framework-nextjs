import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMenu,
  deleteMenu,
  getMenuById,
  getMenus,
  getMenusByApplication,
  getSubMenus,
  updateMenu,
  updateMenuStatus,
} from '@/actions/menus';
import { MenuFormData } from '../types';

interface MenuQueryParams {
  applicationId?: number;
  name?: string;
  type?: string;
}

export const useMenus = (params?: MenuQueryParams) => {
  return useQuery<MenuFormData[]>({
    queryKey: ['menus', params],
    queryFn: () => getMenus(params),
  });
};

export const useMenuById = (id: number) => {
  return useQuery<MenuFormData>({
    queryKey: ['menus', id],
    queryFn: () => getMenuById(id),
    enabled: !!id,
  });
};

export const useMenusByApplication = (applicationId: number) => {
  return useQuery<MenuFormData[]>({
    queryKey: ['menus', 'application', applicationId],
    queryFn: () => getMenusByApplication(applicationId),
    enabled: !!applicationId,
  });
};

export const useSubMenus = (parentId: number) => {
  return useQuery<MenuFormData[]>({
    queryKey: ['menus', 'parent', parentId],
    queryFn: () => getSubMenus(parentId),
    enabled: !!parentId,
  });
};

export const useAddMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenu,
    onSuccess: (newMenu) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      if (newMenu.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ['menus', 'application', newMenu.applicationId],
        });
      }
      if (newMenu.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['menus', 'parent', newMenu.parentId],
        });
      }
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MenuFormData> }) => updateMenu(id, data),
    onSuccess: (updatedMenu, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.invalidateQueries({ queryKey: ['menus', id] });
      if (updatedMenu.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ['menus', 'application', updatedMenu.applicationId],
        });
      }
      if (updatedMenu.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['menus', 'parent', updatedMenu.parentId],
        });
      }
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMenu,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.removeQueries({ queryKey: ['menus', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['menus', 'application'] });
      queryClient.invalidateQueries({ queryKey: ['menus', 'parent'] });
    },
  });
};

export const useUpdateMenuPosition = () => {};

export const useUpdateMenuStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      updateMenuStatus(id, status),
    onSuccess: (updatedMenu, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.invalidateQueries({ queryKey: ['menus', id] });
      if (updatedMenu.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ['menus', 'application', updatedMenu.applicationId],
        });
      }
      if (updatedMenu.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['menus', 'parent', updatedMenu.parentId],
        });
      }
    },
  });
};
