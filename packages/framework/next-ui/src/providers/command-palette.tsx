'use client';

import { createContext, use, useState } from 'react';

export interface IGRPCommandPaletteValue {
  state: { open: boolean };
  actions: { open: () => void; close: () => void; toggle: () => void };
}

const CommandPaletteContext = createContext<IGRPCommandPaletteValue | null>(null);

/**
 * Owns the command palette's open state. Mounted by `IGRPRootProvidersFull`, so
 * any component under the layout can open the palette with
 * `useIGRPCommandPalette()`. It installs no keyboard listener: the ⌘K / Ctrl+K
 * shortcut belongs to `IGRPTemplateCommandSearch`, so an app without a built-in
 * palette keeps the browser's own Ctrl+K.
 */
export function IGRPCommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Stable across renders, so a listener keyed on `toggle` is not re-installed on every open.
  const [actions] = useState<IGRPCommandPaletteValue['actions']>(() => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((prev) => !prev),
  }));

  const value: IGRPCommandPaletteValue = { state: { open }, actions };

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
