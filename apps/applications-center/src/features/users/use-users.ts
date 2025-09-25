import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addRolesToUser, getCurrentUser, getUsers, inviteUser } from '@/actions/user';
import { CreateUserRequest, IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

export const useUsers = () => {
  return useQuery<IGRPUserDTO[]>({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });
};

export const useCurrentUser = () => {
  return useQuery<IGRPUserDTO>({
    queryKey: ['current-user'],
    queryFn: async () => getCurrentUser(),
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user }: { user: CreateUserRequest }) => inviteUser(user),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.refetchQueries({ queryKey: ['users'], exact: true });
    },
  });
};

export const useAddUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, roleNames }: { username: string; roleNames: string[] }) =>
      addRolesToUser(username, roleNames),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.refetchQueries({ queryKey: ['users'], exact: true });
    },
  });
};
