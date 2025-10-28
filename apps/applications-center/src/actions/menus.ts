"use server";

import type {
  CreateMenuRequest,
  MenuEntryDTO,
  MenuFilters,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import {
  mapperListMenusCRUD,
  mapperMenuCRUD,
} from "@/features/menus/menu-mapper";
import { getClientAccess } from "./access-client";
import { MenuArgs } from "@/features/menus/menu-schemas";

export async function getMenus(params?: MenuFilters) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.getMenus({ ...params });
    const menus = mapperListMenusCRUD(result);
    return menus;
  } catch (error) {
    console.error(
      "[menus-get]: Erro ao carregar os menus da aplicação.:",
      error,
    );
    throw error;
  }
}

export async function createMenu(menu: CreateMenuRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.createMenu(menu);
    const app = mapperMenuCRUD(result);
    return app;
  } catch (error) {
    console.error("menu-create] Não foi possível criar menu:", error);
    throw error;
  }
}

export async function updateMenu(code: string, updated: UpdateMenuRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.updateMenu(code, updated);
    const app = mapperMenuCRUD(result);
    return app;
  } catch (error) {
    console.error("[menu-update] Não foi possível atualizar menu:", error);
    throw error;
  }
}

export async function deleteMenu(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.deleteMenu(code);
    return result;
  } catch (error) {
    console.error("[menu-update] Não foi possível eleiminar menu:", error);
    throw error;
  }
}

export async function removeRolesFromMenu(
  menuCode: string,
  roleCodes: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.menus.removeRolesFromMenu(menuCode, roleCodes);
    return data;
  } catch (error) {
    console.error(
      "[menu-remove-roles] Não foi possível remover os papéis do menu:",
      error,
    );
    throw error;
  }
}

export async function addRolesToMenu(
  menuCode: string,
  roleCodes: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const {data} = await client.menus.addRolesToMenu(menuCode, roleCodes);
    return data;
  }
  catch (error) {
    console.error(
      "[menu-assign-roles] Não foi possível atribuir os papéis ao menu:",
      error,
    );
    throw error;
  }
}