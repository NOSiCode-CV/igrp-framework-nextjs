// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   getAllPermissions,
//   getPermission,
//   deletePermission,
//   createPermission,
//   updatePermission,
//   getPermissionsByApplication,
//   getPermissionRoles,
// } from '@/actions/permission';
// import { Permission, PermissionRole } from '../types';

// export const useAllPermissions = () => {
//   return useQuery<Permission[]>({
//     queryKey: ['permissions'],
//     queryFn: () => getAllPermissions(),
//   });
// };

// export const usePermissionsByApplication = (appCode: string) => {
//   return useQuery<Permission[]>({
//     queryKey: ['permissions', 'application', appCode],
//     queryFn: () => getPermissionsByApplication(appCode),
//     enabled: !!appCode,
//   });
// };

// export const useCurrentPermission = (id: number) => {
//   return useQuery<Permission>({
//     queryKey: ['current-permission', id],
//     queryFn: () => getPermission(id),
//     enabled: !!id,
//   });
// };

// export const usePermissionRoles = (permissionId: number) => {
//   return useQuery<PermissionRole[]>({
//     queryKey: ['permission-roles', permissionId],
//     queryFn: () => getPermissionRoles(permissionId),
//     enabled: !!permissionId,
//   });
// };

// export const useDeletePermission = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (id: number) => deletePermission(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['permissions'] });
//     },
//   });
// };

// export const useAddPermission = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: createPermission,
//     onSuccess: (newPermission) => {
//       queryClient.invalidateQueries({ queryKey: ['permissions'] });
//       if (newPermission.applicationId) {
//         queryClient.invalidateQueries({
//           queryKey: ['permissions', 'application', newPermission.applicationId],
//         });
//       }
//     },
//   });
// };

// export const useUpdatePermission = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ id, data }: { id: number; data: Partial<Permission> }) =>
//       updatePermission(id, data),
//     onSuccess: (updatedPermission) => {
//       queryClient.invalidateQueries({ queryKey: ['permissions'] });
//       if (updatedPermission.applicationId) {
//         queryClient.invalidateQueries({
//           queryKey: ['permissions', 'application', updatedPermission.applicationId],
//         });
//       }
//     },
//   });
// };
