import { getIGRPAccessClient } from '../../lib/api-client';
import { mapperUser } from './mapper';

export const fetchCurrentUser = async () => {
  try {
    const client = await getIGRPAccessClient();
    const result = await client.users.getCurrentUser();
    const user = mapperUser(result);
    return user;
  } catch (error) {
    console.error('[igrp-framewor-next] Falha ao procurar dados do utilizador atual:', error);
    throw error;
  }
};
