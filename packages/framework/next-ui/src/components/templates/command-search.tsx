'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  cn,
  IGRPIcon,
  IGRPButton,
  IGRPCommandDialogPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandSeparatorPrimitive,
} from '@igrp/igrp-framework-react-design-system';

// TODO: Search items

function IGRPTemplateCommandSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down, { signal });
    return () => {
      controller.abort();
    };
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

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
      <IGRPCommandDialogPrimitive open={open} onOpenChange={setOpen}>
        <IGRPCommandInputPrimitive placeholder="Digite um comando ou pesquisa..." />
        <IGRPCommandListPrimitive>
          <IGRPCommandEmptyPrimitive>Sem Resultados.</IGRPCommandEmptyPrimitive>
          <IGRPCommandGroupPrimitive heading="Suggestions">
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/'))}>
              <IGRPIcon iconName="House" className={cn('mr-2')} />
              <span>Home</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/'))}>
              <IGRPIcon iconName="House" className={cn('mr-2')} />
              <span>Library</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/docs'))}>
              <IGRPIcon iconName="FileText" className={cn('mr-2')} />
              <span>Documentation</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/settings'))}>
              <IGRPIcon iconName="Settings" className={cn('mr-2')} />
              <span>Settings</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
          <IGRPCommandSeparatorPrimitive />
          <IGRPCommandGroupPrimitive heading="Team">
            <IGRPCommandItemPrimitive
              onSelect={() => runCommand(() => router.push('/team/invite'))}
            >
              <IGRPIcon iconName="UserPlus" className={cn('mr-2')} />
              <span>Invite Members</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
          <IGRPCommandSeparatorPrimitive />
          <IGRPCommandGroupPrimitive heading="Profile">
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/profile'))}>
              <IGRPIcon iconName="User" className={cn('mr-2')} />
              <span>Profile</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/logout'))}>
              <IGRPIcon iconName="LogOut" className={cn('mr-2')} />
              <span>Logout</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
          <IGRPCommandSeparatorPrimitive />
          <IGRPCommandGroupPrimitive heading="Support">
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/help'))}>
              <IGRPIcon iconName="LifeBuoy" className={cn('mr-2')} />
              <span>Help</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
        </IGRPCommandListPrimitive>
      </IGRPCommandDialogPrimitive>
    </>
  );
}

export { IGRPTemplateCommandSearch };
