'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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
        className="justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3"
      >
        <span className="flex items-center ">
          {/* <Search className="mr-1 size-3" />  use IGRPIcon */}
          <IGRPIcon iconName="Search" className="mr-1 size-3" />
          <span className="hidden md:inline-block">Search</span>
        </span>
        <kbd className="pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </IGRPButton>
      <IGRPCommandDialogPrimitive open={open} onOpenChange={setOpen}>
        <IGRPCommandInputPrimitive placeholder="Type a command or search..." />
        <IGRPCommandListPrimitive>
          <IGRPCommandEmptyPrimitive>No results found.</IGRPCommandEmptyPrimitive>
          <IGRPCommandGroupPrimitive heading="Suggestions">
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/'))}>
              {/* <Home className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />
              <span>Home</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/'))}>
              {/* <Home className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Library</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/docs'))}>
              {/* <FileText className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Documentation</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/settings'))}>
              {/* <Settings className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Settings</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
          <IGRPCommandSeparatorPrimitive />
          <IGRPCommandGroupPrimitive heading="Team">
            <IGRPCommandItemPrimitive
              onSelect={() => runCommand(() => router.push('/team/invite'))}
            >
              {/* <UserPlus className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Invite Members</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
          <IGRPCommandSeparatorPrimitive />
          <IGRPCommandGroupPrimitive heading="Profile">
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/profile'))}>
              {/* <User className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Profile</span>
            </IGRPCommandItemPrimitive>
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/logout'))}>
              {/* <LogOut className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Logout</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
          <IGRPCommandSeparatorPrimitive />
          <IGRPCommandGroupPrimitive heading="Support">
            <IGRPCommandItemPrimitive onSelect={() => runCommand(() => router.push('/help'))}>
              {/* <LifeBuoy className="mr-2" /> */}
              <IGRPIcon iconName="Home" className="mr-2" />

              <span>Help</span>
            </IGRPCommandItemPrimitive>
          </IGRPCommandGroupPrimitive>
        </IGRPCommandListPrimitive>
      </IGRPCommandDialogPrimitive>
    </>
  );
}

export { IGRPTemplateCommandSearch };
