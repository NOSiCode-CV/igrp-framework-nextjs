import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Department } from '../types';
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
} from '@/actions/departaments';

export const useAllDepartments = () => {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => getAllDepartments(),
  });
};

export const useCurrentDepartment = (id: number) => {
  return useQuery<Department>({
    queryKey: ['current-department', id],
    queryFn: () => getDepartment(id),
    enabled: !!id,
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useAddDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Department> }) =>
      updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
