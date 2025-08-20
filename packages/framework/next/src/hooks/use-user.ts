import { getIGRPAccessClient } from '../lib/api-client';
import { mapperUser } from '../mappers/mapperUsers';

export const fetchCurrentUser = async () => {
  try {
    const client = await getIGRPAccessClient();
    const result = await client.users.getCurrentUser();
    const user = mapperUser(result);
    return user;
  } catch (error) {
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    throw error;
  }
};
