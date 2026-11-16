'use client';

import { Fragment, Suspense, use } from 'react';
import {
  IGRPIcon,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
  const runCommand = (command: () => unknown) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={labels.dialogTitle}
      description={labels.dialogDescription}
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
          {Array.isArray(commands) ? (
            <PaletteGroups commands={commands} onRun={runCommand} />
          ) : (
            <Suspense fallback={null}>
              <AwaitedPaletteGroups commands={commands} onRun={runCommand} />
            </Suspense>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

interface PaletteGroupsProps {
  commands: IGRPCommandItem[];
  onRun: (command: () => unknown) => void;
}

function PaletteGroups({ commands, onRun }: PaletteGroupsProps) {
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
                  keywords={[item.label, group ?? '']}
                  className="cursor-pointer gap-3 px-3 py-2.5"
                  onSelect={() => onRun(item.onSelect)}
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

function AwaitedPaletteGroups({
  commands,
  onRun,
}: Omit<PaletteGroupsProps, 'commands'> & { commands: Promise<IGRPCommandItem[]> }) {
  return <PaletteGroups commands={use(commands)} onRun={onRun} />;
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * cmdk scores `value` too; ours is a unique id/index, so match the keywords only.
 * cmdk's own `commandScore` is not exported, so: every search token must occur in
 * some keyword word ("rel con" finds "Relatórios Contabilísticos").
 */
function filterByKeywords(_value: string, search: string, keywords?: string[]): number {
  const words = fold((keywords ?? []).join(' ')).split(/\s+/);
  const tokens = fold(search).split(/\s+/).filter(Boolean);
  return tokens.every((token) => words.some((word) => word.includes(token))) ? 1 : 0;
}

export { IGRPCommandPalette, type IGRPCommandPaletteProps };
