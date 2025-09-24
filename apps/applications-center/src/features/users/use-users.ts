import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getUsers } from '@/actions/user';
import { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

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
