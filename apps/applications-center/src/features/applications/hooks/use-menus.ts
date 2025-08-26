import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { MenuFilters } from '@igrp/platform-access-management-client-ts';

import {
  // createMenu,
  // deleteMenu,
  // getMenuByCode,
  getMenus,
  // getMenusByApplication,
  // getSubMenus,
  // updateMenu,
  // updateMenuStatus,
} from '@/actions/menus';


export const useMenus = (params?: MenuFilters) => {
  const key = [
    'menus',
    params?.applicationCode ?? null,
  ] as const;

  return useQuery<IGRPMenuItemArgs[]>({
    queryKey: key,
    queryFn: () => getMenus(params),
    enabled: !!(params?.applicationCode),
  });
};

// export const useMenuByCode = (code: string) => {
//   return useQuery<IGRPMenuItemArgs>({
//     queryKey: ['menus', code],
//     queryFn: () => getMenuByCode(code),
//     enabled: !!code,
//   });
// };

// export const useMenusByApplication = (applicationId: number) => {
//   return useQuery<IGRPMenuItemArgs[]>({
//     queryKey: ['menus', 'application', applicationId],
//     queryFn: () => getMenusByApplication(applicationId),
//     enabled: !!applicationId,
//   });
// };

// export const useSubMenus = (parentId: number) => {
//   return useQuery<IGRPMenuItemArgs[]>({
//     queryKey: ['menus', 'parent', parentId],
//     queryFn: () => getSubMenus(parentId),
//     enabled: !!parentId,
//   });
// };

// export const useAddMenu = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: createMenu,
//     onSuccess: (newMenu) => {
//       queryClient.invalidateQueries({ queryKey: ['menus'] });
//       if (newMenu.applicationId) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'application', newMenu.applicationId],
//         });
//       }
//       if (newMenu.parentId) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'parent', newMenu.parentId],
//         });
//       }
//     },
//   });
// };

// export const useUpdateMenu = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ code, data }: { code: string; data: Partial<IGRPMenuItemArgs> }) => updateMenu(id, data),
//     onSuccess: (updatedMenu, { code }) => {
//       queryClient.invalidateQueries({ queryKey: ['menus'] });
//       queryClient.invalidateQueries({ queryKey: ['menus', code] });
//       if (updatedMenu.applicationCode) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'application', updatedMenu.applicationCode],
//         });
//       }
//       if (updatedMenu.parentCode) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'parent', updatedMenu.parentCode],
//         });
//       }
//     },
//   });
// };

// export const useDeleteMenu = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: deleteMenu,
//     onSuccess: (_, deletedCode) => {
//       queryClient.invalidateQueries({ queryKey: ['menus'] });
//       queryClient.removeQueries({ queryKey: ['menus', deletedCode] });
//       queryClient.invalidateQueries({ queryKey: ['menus', 'application'] });
//       queryClient.invalidateQueries({ queryKey: ['menus', 'parent'] });
//     },
//   });
// };

// export const useUpdateMenuPosition = () => {};

// export const useUpdateMenuStatus = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
//       updateMenuStatus(id, status),
//     onSuccess: (updatedMenu, { id }) => {
//       queryClient.invalidateQueries({ queryKey: ['menus'] });
//       queryClient.invalidateQueries({ queryKey: ['menus', id] });
//       if (updatedMenu.applicationId) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'application', updatedMenu.applicationId],
//         });
//       }
//       if (updatedMenu.parentId) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'parent', updatedMenu.parentId],
//         });
//       }
//     },
//   });
// };


// export const useUpdateMenu = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
// -   mutationFn: ({ code, data }: { code: string; data: Partial<IGRPMenuItemArgs> }) => updateMenu(id, data),
// -   onSuccess: (updatedMenu, { code }) => {
// +   mutationFn: ({ id, data }: { id: number; data: Partial<IGRPMenuItemArgs> }) => updateMenu(id, data),
// +   onSuccess: (updatedMenu, { id }) => {
//       queryClient.invalidateQueries({ queryKey: ['menus'] });
// -     queryClient.invalidateQueries({ queryKey: ['menus', code] });
// +     queryClient.invalidateQueries({ queryKey: ['menus', id] });
//       if (updatedMenu.applicationCode) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'application', updatedMenu.applicationCode],
//         });
//       }
//       if (updatedMenu.parentCode) {
//         queryClient.invalidateQueries({
//           queryKey: ['menus', 'parent', updatedMenu.parentCode],
//         });
//       }
//     },
//   });
// };
