'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Settings, User, FileText, LifeBuoy, LogOut, UserPlus, Search } from 'lucide-react';

import { Button } from '@/components/primitives/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/primitives/command';

// TODO: add messages, and the lis of search, with the respective url

export function CommandSearch() {
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
      <Button
        onClick={() => setOpen(true)}
        variant='outline'
        size='lg'
        className='justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3'
      >
        <span className='flex items-center '>
          <Search className='mr-1 size-3' />
          <span className='hidden md:inline-block'>Search</span>
        </span>
        <kbd className='pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
      >
        <CommandInput placeholder='Type a command or search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading='Suggestions'>
            <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
              <Home className='mr-2' />
              <span>Home</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
              <Home className='mr-2' />
              <span>Library</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/docs'))}>
              <FileText className='mr-2' />
              <span>Documentation</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
              <Settings className='mr-2' />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Team'>
            <CommandItem onSelect={() => runCommand(() => router.push('/team/invite'))}>
              <UserPlus className='mr-2' />
              <span>Invite Members</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Profile'>
            <CommandItem onSelect={() => runCommand(() => router.push('/profile'))}>
              <User className='mr-2' />
              <span>Profile</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/logout'))}>
              <LogOut className='mr-2' />
              <span>Logout</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Support'>
            <CommandItem onSelect={() => runCommand(() => router.push('/help'))}>
              <LifeBuoy className='mr-2' />
              <span>Help</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
