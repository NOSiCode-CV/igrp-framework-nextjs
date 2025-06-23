'use server'

import { cookies } from "next/headers";

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('igrp_active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return { activeThemeValue, isScaled };
}