'use client';

import { createContext, use, useEffect, useState } from 'react';

export interface IGRPCommandPaletteValue {
  state: { open: boolean };
  actions: { open: () => void; close: () => void; toggle: () => void };
}

const CommandPaletteContext = createContext<IGRPCommandPaletteValue | null>(null);

/**
 * Owns the command palette's open state and the single ⌘K / Ctrl+K listener.
 * Mounted by `IGRPRootProvidersFull`, so any component under the layout can
 * open the palette with `useIGRPCommandPalette()`.
 */
export function IGRPCommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, []);

  const value: IGRPCommandPaletteValue = {
    state: { open },
    actions: {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
    },
  };

  return <CommandPaletteContext value={value}>{children}</CommandPaletteContext>;
}

/** The palette provider's value, or `null` outside one. Internal. */
export function useOptionalIGRPCommandPalette(): IGRPCommandPaletteValue | null {
  return use(CommandPaletteContext);
}

/** Open, close or toggle the header command palette. Requires `IGRPCommandPaletteProvider`. */
export function useIGRPCommandPalette(): IGRPCommandPaletteValue {
  const value = use(CommandPaletteContext);
  if (!value) {
    // igrp-i18n-ignore: developer error
    throw new Error('useIGRPCommandPalette must be used inside IGRPCommandPaletteProvider.');
  }
  return value;
}
