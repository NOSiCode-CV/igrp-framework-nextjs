import { igrpGetAccessClient } from '../lib/api-client';

export const fetchCurrentUser = async () => {
  try {
    const client = await igrpGetAccessClient();
    const result = await client.users.getCurrentUser();
    const user = result.data;
    return user;
  } catch (error) {
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    throw new Error();
  }
};
