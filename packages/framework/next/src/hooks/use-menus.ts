import { igrpGetAccessClient } from '../lib/api-client';

export const fetchMenus = async (appCode: string) => {
  try {
    const client = await igrpGetAccessClient();
    const result = await client.menus.getMenus({ applicationCode: appCode });
    const menus = result.data;
    return menus ?? [];
  } catch (error) {
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    throw error;
  }
};
