'use client';

import { createContext, useContext } from 'react';
import type { IGRPResolvedConfig } from '../types';

const IGRPConfigContext = createContext<IGRPResolvedConfig | null>(null);

export const IGRPConfigProvider = IGRPConfigContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function useIGRPConfig(): IGRPResolvedConfig {
  const ctx = useContext(IGRPConfigContext);
  if (!ctx) {
    throw new Error('useIGRPConfig must be used within an <IGRPConfigProvider>');
  }
  return ctx;
}
