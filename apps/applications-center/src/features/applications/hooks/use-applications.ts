import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createApplication,
  deleteApplication,
  getAppImage,
  getApplicationById,
  getApplications,
  updateApplication,
} from '@/actions/applications';
import { Application } from '@/features/applications/types';

export const useApplications = () => {
  return useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => getApplications(),
  });
};

export const useApplicationById = (id: number) => {
  return useQuery<Application>({
    queryKey: ['applications', id],
    queryFn: () => getApplicationById(id),
  });
};

export const useAddApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Application> }) =>
      updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useGetAppImage = (appId: number) => {
  return useQuery<string>({
    queryKey: ['applications', appId],
    queryFn: () => getAppImage(appId),
    enabled: !!appId,
  });
};
