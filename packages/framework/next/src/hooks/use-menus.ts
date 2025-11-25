import { igrpGetAccessClient } from '../lib/api-client';
import { mapperMenus } from '../mappers/menus-mapper';

export const fetchMenus = async (appCode: string) => {
  try {
    const client = await igrpGetAccessClient();
    const result = await client.users.getCurrentUserApplicationMenus(appCode);
    const menus = mapperMenus(result);
    return menus;
  } catch (error) {
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    throw error;
  }
};
