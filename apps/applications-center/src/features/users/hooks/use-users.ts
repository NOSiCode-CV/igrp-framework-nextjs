import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllUsers,
  getUser,
  deleteUser,
  getDepartment,
  getApps,
  getRoles,
  inviteUser,
  getRolesFromUser,
  updateUserProfile,
  getUserImage,
  getUserSignature,
} from '@/actions/user';
import type {
  DepartmentProps,
  InviteUserProps,
  UserProps,
  UserPropsImage,
} from '@/features/users/types';
import { OptionsProps } from '@/types/global';

export const useAllUsers = () => {
  return useQuery<UserProps[]>({
    queryKey: ['users'],
    queryFn: () => getAllUsers(),
  });
};

export const useCurrentUser = () => {
  return useQuery<UserProps>({
    queryKey: ['current-user'],
    queryFn: async () => getUser(),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => deleteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useApps = () => {
  return useQuery<OptionsProps[]>({
    queryKey: ['user-apps'],
    queryFn: () => getApps(),
  });
};

export const useDepartments = (appCode?: string) => {
  return useQuery<DepartmentProps[]>({
    queryKey: ['user-department', appCode],
    queryFn: () => getDepartment(appCode),
    enabled: !!appCode,
  });
};
export const useRoles = (appCode?: string, departmentCode?: string) => {
  return useQuery<string[]>({
    queryKey: ['user-roles', appCode, departmentCode],
    queryFn: () => getRoles(appCode, departmentCode),
    enabled: !!appCode && !!departmentCode,
  });
};

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InviteUserProps) => inviteUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRolesFromUser(id?: string) {
  return useQuery<string[]>({
    queryKey: ['user-roles-from', id],
    queryFn: () => getRolesFromUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => updateUserProfile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user', 'users'] });
    },
  });
}

export const useUserImage = () => {
  return useQuery<UserPropsImage>({
    queryKey: ['current-user-img'],
    queryFn: () => getUserImage(),
  });
};

export const useUserSignature = () => {
  return useQuery<UserPropsImage>({
    queryKey: ['current-user-sig'],
    queryFn: () => getUserSignature(),
  });
};
