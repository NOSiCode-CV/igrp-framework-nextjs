'use client';

import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@igrp/igrp-framework-react-design-system';
import { SearchIcon } from 'lucide-react';

import { useIGRPChromeI18n } from '../i18n/context.js';
import { useOptionalIGRPCommandPalette } from '../providers/command-palette.js';
import { IGRP_CHROME_STRINGS_PT, type IGRPCommandSearchLabels } from '../i18n/strings.js';

export interface IGRPCommandItem {
  /** Optional stable identifier, used as React key and cmdk value. Falls back to group + label + position. */
  id?: string;
  /** Display label shown in the command list. */
  label: string;
  /** Lucide icon name rendered before the label. Optional. */
  icon?: string;
  /** Group heading the item appears under. Items without a group are shown ungrouped. */
  group?: string;
  /** Called when the user selects this item. Give this or `href`. */
  onSelect?: () => void;
  /**
   * Navigated to when the user selects this item (client-side, basePath applied),
   * unless `onSelect` is given. Plain data, so a server component can build the item.
   */
  href?: string;
  /** With `href`: open in a new tab instead of navigating in place. */
  external?: boolean;
}

export type { IGRPCommandSearchLabels };

/** @deprecated Use IGRP_CHROME_STRINGS_PT.commandSearch. */
export const IGRP_COMMAND_SEARCH_LABELS_PT_PT: IGRPCommandSearchLabels =
  IGRP_CHROME_STRINGS_PT.commandSearch;

interface IGRPTemplateCommandSearchProps {
  /**
   * Command items to render in the palette. When omitted, the palette shows only
   * the empty state. A promise is resolved inside the lazily loaded dialog, so
   * the trigger renders (and keeps its state) while the items stream in.
   * Pass a stable promise: a new one on every render suspends the list again.
   */
  commands?: IGRPCommandItem[] | Promise<IGRPCommandItem[]>;
  /** Partial override of the chrome catalog group. Missing keys keep the catalog value. */
  labels?: Partial<IGRPCommandSearchLabels>;
}

const subscribeNever = () => () => {};
const readIsMac = () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

// The dialog (cmdk + Radix dialog) loads on intent: trigger hover/focus or the first ⌘K.
const loadCommandPalette = () => import('./command-palette.js');
const IGRPCommandPalette = lazy(() =>
  loadCommandPalette().then((m) => ({ default: m.IGRPCommandPalette })),
);

// Mounted instances, newest last. Only the newest answers ⌘K, so two triggers
// on one page (a header and a custom one) never toggle the palette twice.
const shortcutOwners: object[] = [];

function IGRPTemplateCommandSearch({
  commands = [],
  labels: labelOverrides,
}: IGRPTemplateCommandSearchProps) {
  // With `IGRPCommandPaletteProvider` (mounted by `IGRPRootProvidersFull`) the
  // provider owns the open state; without one, this does. Either way the ⌘K
  // listener lives here, so only a page that renders a palette claims the key.
  const palette = useOptionalIGRPCommandPalette();
  const [localOpen, setLocalOpen] = useState(false);
  const toggleShared = palette?.actions.toggle;
  const open = palette ? palette.state.open : localOpen;
  const setOpen = (next: boolean) => {
    if (!palette) setLocalOpen(next);
    else if (next) palette.actions.open();
    else palette.actions.close();
  };
  // Mounted on the first open and kept, so closing still runs the dialog's own exit.
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);
  // The shortcut accepts Cmd OR Ctrl, but the hint used to read the Cmd glyph
  // everywhere. The server snapshot is `false`, so hydration matches the server
  // markup and the client re-renders with the real platform.
  const isMac = useSyncExternalStore(subscribeNever, readIsMac, () => false);

  const chrome = useIGRPChromeI18n();
  const labels = labelOverrides
    ? { ...chrome.commandSearch, ...labelOverrides }
    : chrome.commandSearch;

  useEffect(() => {
    const owner = {};
    shortcutOwners.push(owner);
    const controller = new AbortController();

    const down = (e: KeyboardEvent) => {
      if (e.key !== 'k' || !(e.metaKey || e.ctrlKey)) return;
      if (shortcutOwners[shortcutOwners.length - 1] !== owner) return;
      e.preventDefault();
      void loadCommandPalette();
      setEverOpened(true);
      if (toggleShared) toggleShared();
      else setLocalOpen((prev) => !prev);
    };

    document.addEventListener('keydown', down, { signal: controller.signal });
    return () => {
      controller.abort();
      shortcutOwners.splice(shortcutOwners.indexOf(owner), 1);
    };
  }, [toggleShared]);

  const preload = () => void loadCommandPalette();

  return (
    <>
      <Button
        onClick={() => {
          setEverOpened(true);
          setOpen(true);
        }}
        onPointerEnter={preload}
        onFocus={preload}
        variant="outline"
        size="lg"
        className="justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3 shadow-none md:flex-none sm:w-40 lg:w-52"
      >
        <span className="flex items-center">
          <SearchIcon size={16} className="mr-1 size-3" />
          <span>{labels.trigger}</span>
        </span>
        <kbd className="pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium">
          {/* igrp-i18n-ignore: keyboard shortcut */}
          <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      </Button>
      {everOpened && (
        <Suspense fallback={null}>
          <IGRPCommandPalette
            open={open}
            onOpenChange={setOpen}
            commands={commands}
            labels={labels}
          />
        </Suspense>
      )}
    </>
  );
}

export { IGRPTemplateCommandSearch, type IGRPTemplateCommandSearchProps };
