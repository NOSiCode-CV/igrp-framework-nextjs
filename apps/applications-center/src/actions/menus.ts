'use server';

import { getIGRPAccessClient, mapperMenu, mapperMenus } from "@igrp/framework-next";
import { MenuFilters } from "@igrp/platform-access-management-client-ts";
import { refreshAccessClient } from "./igrp/auth";


export async function getMenus(params?: MenuFilters) {
  await refreshAccessClient();
  try {
    const client = await getIGRPAccessClient();
    const result = await client.menus.getMenus({ ...params });
    const menus = mapperMenus(result);
    return menus;
  } catch (error) {
    console.error('[menus-get]: Erro ao carregar os menus da aplicação.:', error);
    throw error;
  }
}

export async function getMenuByCode(code: string) {
    await refreshAccessClient();

  try {
    const client = await getIGRPAccessClient();
    const result = await client.menus.getMenuByCode(code);
    const menus = mapperMenu(result);
    return menus;
  } catch (error) {
    console.error('[menus-get]: Erro ao carregar os menus da aplicação.:', error);
    throw error;
  }
}