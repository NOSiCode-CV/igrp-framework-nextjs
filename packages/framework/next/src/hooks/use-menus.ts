import { getIGRPAccessClient } from '../lib/api-client';
import { mapperMenus } from '../mappers/mapperMenus';

export const fetchMenus = async (appCode: string) => {
  try {
    const client = await getIGRPAccessClient();
    const result = await client.menus.getMenus({ applicationCode: appCode });
    const menus = mapperMenus(result);
    return menus;
  } catch (error) {
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    throw error;
  }
};
