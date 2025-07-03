'use server';

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getLocale, getMessages, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getSession } from "./auth";

export async function setLocale() {
  const locale = await getLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale
}

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('igrp_active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return { activeThemeValue, isScaled };
}

export async function getTranslations() {
  const messages = await getMessages();
  return messages;
}

export async function configLayout() {
  const locale = await setLocale();
  const session = await getSession();
  const { activeThemeValue, isScaled } = await getTheme();

  return { locale, session, activeThemeValue, isScaled };
}

