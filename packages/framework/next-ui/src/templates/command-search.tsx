'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  IGRPIcon,
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@igrp/igrp-framework-react-design-system';

export interface IGRPCommandItem {
  /** Optional stable identifier for use as React key. Falls back to label. */
  id?: string;
  /** Display label shown in the command list. */
  label: string;
  /** Lucide icon name rendered before the label. Optional. */
  icon?: string;
  /** Group heading the item appears under. Items without a group are shown ungrouped. */
  group?: string;
  /** Called when the user selects this item. */
  onSelect: () => void;
}

/** pt-PT defaults for the command palette. Override individually. */
export interface IGRPCommandSearchLabels {
  /** Text on the collapsed trigger button. */
  trigger: string;
  /** Placeholder of the palette's own input. */
  placeholder: string;
  /** Shown when nothing matches. */
  empty: string;
  /**
   * Accessible name of the dialog. The design system's `CommandDialog` renders
   * this in an `sr-only` `DialogTitle` and defaults it to the English
   * "Command Palette" — so without this the one string only screen-reader users
   * hear was the one string still not in pt-PT.
   */
  dialogTitle: string;
  /** Accessible description of the dialog, rendered `sr-only`. */
  dialogDescription: string;
}

export const IGRP_COMMAND_SEARCH_LABELS_PT_PT: IGRPCommandSearchLabels = {
  trigger: 'Pesquisar...',
  placeholder: 'Digite um comando ou pesquisa...',
  empty: 'Sem resultados.',
  dialogTitle: 'Paleta de comandos',
  dialogDescription: 'Pesquise e execute um comando.',
};

interface IGRPTemplateCommandSearchProps {
  /** Command items to render in the palette. When omitted, the palette shows only the empty state. */
  commands?: IGRPCommandItem[];
  /** Partial override of the pt-PT strings. Missing keys keep their default. */
  labels?: Partial<IGRPCommandSearchLabels>;
}

function IGRPTemplateCommandSearch({
  commands = [],
  labels: labelOverrides,
}: IGRPTemplateCommandSearchProps) {
  const [open, setOpen] = useState(false);
  // The shortcut accepts Cmd OR Ctrl, but the hint used to read the Cmd glyph
  // everywhere. Resolved after mount so the server and client markup agree.
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
  }, []);

  const labels = labelOverrides
    ? { ...IGRP_COMMAND_SEARCH_LABELS_PT_PT, ...labelOverrides }
    : IGRP_COMMAND_SEARCH_LABELS_PT_PT;

  useEffect(() => {
    const controller = new AbortController();

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down, { signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // Group commands by their `group` field. Items without a group are collected under undefined.
  const grouped = useMemo(
    () =>
      commands.reduce<Map<string | undefined, IGRPCommandItem[]>>((acc, item) => {
        const key = item.group;
        const list = acc.get(key) ?? [];
        list.push(item);
        acc.set(key, list);
        return acc;
      }, new Map()),
    [commands],
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="lg"
        className="justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3 shadow-none md:flex-none sm:w-40 lg:w-52"
      >
        <span className="flex items-center">
          <IGRPIcon iconName="Search" className="mr-1 size-3" />
          <span>{labels.trigger}</span>
        </span>
        <kbd className="pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium">
          <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={labels.dialogTitle}
        description={labels.dialogDescription}
      >
        {/* The design system's `CommandDialog` (current shadcn shape) renders its
            children straight into `DialogContent` — it no longer supplies the cmdk
            root. Without this `Command`, cmdk's store context is undefined and
            `CommandInput` throws on mount, taking the whole header down. */}
        <Command>
          <CommandInput placeholder={labels.placeholder} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
              <Fragment key={group ?? 'ungrouped'}>
                {groupIndex > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id ?? item.label}
                      onSelect={() => runCommand(item.onSelect)}
                    >
                      {item.icon && <IGRPIcon iconName={item.icon} className="mr-2" />}
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export { IGRPTemplateCommandSearch, type IGRPTemplateCommandSearchProps };
