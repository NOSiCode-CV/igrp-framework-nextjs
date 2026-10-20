import type { IGRPBranding } from '@igrp/framework-next-types';

export interface ResolvedHeaderLogo {
  light: string;
  dark?: string;
}

export interface ResolvedWideLogo {
  src: string;
  srcDark?: string;
  width: number;
  height: number;
}

/** Brand header mark, then the app's `headerLogo`, then the framework fallback. */
export function resolveHeaderLogo(args: {
  branding: IGRPBranding | null;
  headerLogo?: string;
  fallback: string;
}): ResolvedHeaderLogo {
  const slot = args.branding?.logos.header;
  if (slot) return { light: slot.light, dark: slot.dark };
  if (args.headerLogo) return { light: args.headerLogo };
  return { light: args.fallback };
}

/** Brand wide logo with its size, or the app's own logo with its size. */
export function resolveWideLogo(args: {
  branding: IGRPBranding | null;
  fallback: { src: string; srcDark?: string; width: number; height: number };
}): ResolvedWideLogo {
  const slot = args.branding?.logos.wide;
  if (!slot) return { ...args.fallback };
  return {
    src: slot.light,
    srcDark: slot.dark,
    width: slot.width ?? args.fallback.width,
    height: slot.height ?? args.fallback.height,
  };
}
