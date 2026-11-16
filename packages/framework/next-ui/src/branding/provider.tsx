'use client';

import { createContext, type ReactNode, use } from 'react';

import type { IGRPBranding } from '@igrp/framework-next-types';

const BrandingContext = createContext<IGRPBranding | null>(null);

/** Exposes the Brand logos to chrome components. `null` means every Default. */
export function IGRPBrandingProvider({
  branding,
  children,
}: {
  branding: IGRPBranding | null;
  children: ReactNode;
}) {
  return <BrandingContext value={branding}>{children}</BrandingContext>;
}

/** The current Brand, or `null` when outside a provider or none is set. Never throws. */
export function useIGRPBranding(): IGRPBranding | null {
  return use(BrandingContext);
}
