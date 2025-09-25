'use server';

import { CreateUserRequest, UserFilters } from '@igrp/platform-access-management-client-ts';
import { getClientAccess } from './access-client';
import { UserArgs } from '@/features/users/user-schema';

export async function getUsers(params?: UserFilters) {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUsers(params);
    return result.data;
  } catch (error) {
    console.error('[users] Erro ao carregar lista de utilizadores.:', error);
    throw error;
  }
}
export async function getCurrentUser() {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUser();
    return result.data;
  } catch (error) {
    console.error('[user-current] Erro ao carregar os dados do utilizador atual.:', error);
    throw error;
  }
}
export async function inviteUser(user: CreateUserRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.users.inviteUser(user);
    return result.data;
  } catch (error) {
    console.error('[user-invite] Erro ao carregar os dados do utilizador atual.:', error);
    throw error;
  }
}

export async function addRolesToUser(username: string, roleNames: string[]) {
  const client = await getClientAccess();

  try {
    const result = await client.users.addRolesToUser(username, roleNames);
    return result.data;
  } catch (error) {
    console.error('[user-invite] Erro ao carregar os dados do utilizador atual.:', error);
    throw error;
  }
}
