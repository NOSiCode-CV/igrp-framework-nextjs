import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // createDepartment,
  // deleteDepartment,
  getDepartments,
  // getDepartment,
  // updateDepartment,
} from '@/actions/departaments';
import { IGRPDepartmentArgs } from '@igrp/framework-next-types';

export const useDepartments = () => {
  return useQuery<IGRPDepartmentArgs[]>({
    queryKey: ['departments'],
    queryFn: () => getDepartments(),
  });
};

// export const useCurrentDepartment = (id: number) => {
//   return useQuery<IGRPDepartmentArgs>({
//     queryKey: ['current-department', id],
//     queryFn: () => getDepartment(id),
//     enabled: !!id,
//   });
// };

// export const useDeleteDepartment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (id: number) => deleteDepartment(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['departments'] });
//     },
//   });
// };

// export const useAddDepartment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: createDepartment,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['departments'] });
//     },
//   });
// };

// export const useUpdateDepartment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ id, data }: { id: number; data: Partial<IGRPDepartmentArgs> }) =>
//       updateDepartment(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['departments'] });
//     },
//   });
// };
