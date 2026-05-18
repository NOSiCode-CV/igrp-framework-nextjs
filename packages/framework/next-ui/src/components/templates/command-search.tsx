'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  cn,
  IGRPIcon,
  IGRPButton,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@igrp/igrp-framework-react-design-system';

export interface IGRPCommandItem {
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
  const grouped = commands.reduce<Map<string | undefined, IGRPCommandItem[]>>((acc, item) => {
    const key = item.group;
    const list = acc.get(key) ?? [];
    list.push(item);
    acc.set(key, list);
    return acc;
  }, new Map());

  return (
    <>
      <IGRPButton
        onClick={() => setOpen(true)}
        variant="outline"
        size="lg"
        className={cn(
          'justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3 shadow-none sm:pe-12 md:flex-none sm:w-40 lg:w-52 xl:w-64',
        )}
      >
        <span className={cn('flex items-center ')}>
          <IGRPIcon iconName="Search" className={cn('mr-1 size-3')} />
          <span>Pesquisar...</span>
        </span>
        <kbd
          className={cn(
            'pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium',
          )}
        >
          <span className={cn('text-xs')}>⌘</span>K
        </kbd>
      </IGRPButton>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou pesquisa..." />
        <CommandList>
          <CommandEmpty>Sem Resultados.</CommandEmpty>
          {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
            <>
              {groupIndex > 0 && <CommandSeparator key={`sep-${group ?? 'ungrouped'}`} />}
              <CommandGroup key={group ?? 'ungrouped'} heading={group}>
                {items.map((item) => (
                  <CommandItem
                    key={item.label}
                    onSelect={() => runCommand(item.onSelect)}
                  >
                    {item.icon && <IGRPIcon iconName={item.icon} className={cn('mr-2')} />}
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export { IGRPTemplateCommandSearch, type IGRPTemplateCommandSearchProps };
