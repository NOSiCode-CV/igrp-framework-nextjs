'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  IGRPIcon,
  Button,
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

interface IGRPTemplateCommandSearchProps {
  /** Command items to render in the palette. When omitted, the palette shows only the empty state. */
  commands?: IGRPCommandItem[];
}

function IGRPTemplateCommandSearch({ commands = [] }: IGRPTemplateCommandSearchProps) {
  const [open, setOpen] = useState(false);

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
        className='justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3 shadow-none md:flex-none sm:w-40 lg:w-52'
      >
        <span className='flex items-center'>
          <IGRPIcon iconName="Search" className='mr-1 size-3' />
          <span>Pesquisar...</span>
        </span>
        <kbd
          className='pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium'
        >
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou pesquisa..." />
        <CommandList>
          <CommandEmpty>Sem Resultados.</CommandEmpty>
          {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
            <Fragment key={group ?? 'ungrouped'}>
              {groupIndex > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id ?? item.label}
                    onSelect={() => runCommand(item.onSelect)}
                  >
                    {item.icon && <IGRPIcon iconName={item.icon} className='mr-2' />}
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export { IGRPTemplateCommandSearch, type IGRPTemplateCommandSearchProps };
