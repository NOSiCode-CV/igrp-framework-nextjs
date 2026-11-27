'use client';

import { Fragment, Suspense, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  IGRPIcon,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@igrp/igrp-framework-react-design-system';

import type { IGRPCommandSearchLabels } from '../i18n/strings.js';
import type { IGRPCommandItem } from './command-search.js';

interface IGRPCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A promise is resolved here, behind the dialog's own Suspense boundary. */
  commands: IGRPCommandItem[] | Promise<IGRPCommandItem[]>;
  labels: IGRPCommandSearchLabels;
}

/**
 * The dialog half of `IGRPTemplateCommandSearch`, split out so cmdk and the
 * dialog stay out of the header's initial bundle: the trigger lazy-loads this
 * module on hover/focus/⌘K and mounts it after the first open.
 */
function IGRPCommandPalette({ open, onOpenChange, commands, labels }: IGRPCommandPaletteProps) {
  const router = useRouter();
  const runCommand = (item: IGRPCommandItem) => {
    onOpenChange(false);
    if (item.onSelect) item.onSelect();
    // router.push applies basePath; window.open is only for other origins / new tabs.
    else if (item.href && item.external) window.open(item.href, '_blank', 'noopener,noreferrer');
    else if (item.href) router.push(item.href);
  };

  // Radix returns focus only to a `DialogTrigger`, and this dialog is opened from
  // the search button or ⌘K, so it would drop focus on <body>. Remember what had
  // focus when it opened and return there on close.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Same markup as the DS `CommandDialog`, which doesn't pass content props through.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>{labels.dialogTitle}</DialogTitle>
        <DialogDescription>{labels.dialogDescription}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0"
        showCloseButton={false}
        onOpenAutoFocus={() => {
          const active = document.activeElement;
          returnFocusRef.current =
            active instanceof HTMLElement && active !== document.body ? active : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (!target?.isConnected) return;
          event.preventDefault();
          target.focus();
        }}
      >
        {/* The design system's `CommandDialog` (current shadcn shape) renders its
          children straight into `DialogContent` — it no longer supplies the cmdk
          root. Without this `Command`, cmdk's store context is undefined and
          `CommandInput` throws on mount, taking the whole header down. */}
        {/* Palette-only spacing. The input wrapper and InputGroup take no
          className from `CommandInput`, so they are reached through their
          `data-slot`s; the item gap goes on cmdk's `[cmdk-group-items]` list. */}
        <Command
          filter={filterByKeywords}
          className="p-2 **:data-[slot=command-input-wrapper]:pb-2 **:data-[slot=input-group]:h-10!"
        >
          <CommandInput placeholder={labels.placeholder} />
          <CommandList className="max-h-96 scroll-py-2">
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <Suspense fallback={null}>
              <PaletteGroups commands={commands} onRun={runCommand} />
            </Suspense>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

interface PaletteGroupsProps {
  commands: IGRPCommandPaletteProps['commands'];
  onRun: (item: IGRPCommandItem) => void;
}

function PaletteGroups({ commands, onRun }: PaletteGroupsProps) {
  // An array never suspends; a promise suspends to the boundary above.
  const list = Array.isArray(commands) ? commands : use(commands);
  // Group commands by their `group` field. Items without a group are collected under undefined.
  const grouped = list.reduce<Map<string | undefined, IGRPCommandItem[]>>((acc, item) => {
    const key = item.group;
    const list = acc.get(key) ?? [];
    list.push(item);
    acc.set(key, list);
    return acc;
  }, new Map());

  return (
    <>
      {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
        <Fragment key={group ?? 'ungrouped'}>
          {groupIndex > 0 && <CommandSeparator className="my-2" />}
          <CommandGroup
            className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pb-2 **:[[cmdk-group-items]]:flex **:[[cmdk-group-items]]:flex-col **:[[cmdk-group-items]]:gap-1"
            heading={group}
          >
            {items.map((item, index) => {
              // cmdk selects by `value` (the label by default), so duplicate labels
              // highlighted together and Enter ran the first; filter on `keywords`.
              const value = item.id ?? `${group ?? ''}/${item.label}/${index}`;
              return (
                <CommandItem
                  key={value}
                  value={value}
                  // Folded here, not in the filter: cmdk runs the filter per item per keystroke.
                  keywords={[fold(item.label), fold(group ?? '')]}
                  className="cursor-pointer gap-3 px-3 py-2.5"
                  onSelect={() => onRun(item)}
                >
                  {item.icon && <IGRPIcon iconName={item.icon} />}
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Fragment>
      ))}
    </>
  );
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * cmdk scores `value` too; ours is a unique id/index, so match the keywords only.
 * cmdk's own `commandScore` is not exported, so: every search token must occur in
 * some keyword word ("rel con" finds "Relatórios Contabilísticos").
 */
function filterByKeywords(_value: string, search: string, keywords?: string[]): number {
  const words = (keywords ?? []).join(' ').split(/\s+/);
  const tokens = fold(search).split(/\s+/).filter(Boolean);
  return tokens.every((token) => words.some((word) => word.includes(token))) ? 1 : 0;
}

export { IGRPCommandPalette, type IGRPCommandPaletteProps };
