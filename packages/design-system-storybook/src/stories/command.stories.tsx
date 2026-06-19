import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState } from 'react';
import {
  IGRPCommand,
  IGRPCommandDialog,
  IGRPCommandInput,
  IGRPCommandList,
  IGRPCommandEmpty,
  IGRPCommandGroup,
  IGRPCommandItem,
  IGRPCommandShortcut,
  IGRPCommandSeparator,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Command',
  component: IGRPCommand,
} satisfies Meta<typeof IGRPCommand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline command palette with grouped items, shortcuts and a separator. */
export const Default: Story = {
  render: () => (
    <div className='p-6'>
      <IGRPCommand className='max-w-md rounded-lg border shadow-md'>
        <IGRPCommandInput placeholder='Type a command or search…' />
        <IGRPCommandList>
          <IGRPCommandEmpty>No results found.</IGRPCommandEmpty>
          <IGRPCommandGroup heading='Suggestions'>
            <IGRPCommandItem>Calendar</IGRPCommandItem>
            <IGRPCommandItem>Search Emoji</IGRPCommandItem>
            <IGRPCommandItem>Calculator</IGRPCommandItem>
          </IGRPCommandGroup>
          <IGRPCommandSeparator />
          <IGRPCommandGroup heading='Settings'>
            <IGRPCommandItem>
              Profile
              <IGRPCommandShortcut>⌘P</IGRPCommandShortcut>
            </IGRPCommandItem>
            <IGRPCommandItem>
              Billing
              <IGRPCommandShortcut>⌘B</IGRPCommandShortcut>
            </IGRPCommandItem>
            <IGRPCommandItem>
              Settings
              <IGRPCommandShortcut>⌘S</IGRPCommandShortcut>
            </IGRPCommandItem>
          </IGRPCommandGroup>
        </IGRPCommandList>
      </IGRPCommand>
    </div>
  ),
};

/** Command palette inside a dialog, toggled by a button or the ⌘K / Ctrl+K shortcut. */
export const InDialog: Story = {
  render: () => {
    const DialogDemo = () => {
      const [open, setOpen] = useState(false);

      useEffect(() => {
        const down = (e: KeyboardEvent) => {
          if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
      }, []);

      return (
        <div className='p-6'>
          <IGRPButton variant='outline' onClick={() => setOpen(true)}>
            Open command palette
            <IGRPCommandShortcut>⌘K</IGRPCommandShortcut>
          </IGRPButton>
          <IGRPCommandDialog open={open} onOpenChange={setOpen}>
            <IGRPCommandInput placeholder='Type a command or search…' />
            <IGRPCommandList>
              <IGRPCommandEmpty>No results found.</IGRPCommandEmpty>
              <IGRPCommandGroup heading='Navigation'>
                <IGRPCommandItem onSelect={() => setOpen(false)}>Dashboard</IGRPCommandItem>
                <IGRPCommandItem onSelect={() => setOpen(false)}>Reports</IGRPCommandItem>
                <IGRPCommandItem onSelect={() => setOpen(false)}>Users</IGRPCommandItem>
              </IGRPCommandGroup>
            </IGRPCommandList>
          </IGRPCommandDialog>
        </div>
      );
    };
    return <DialogDemo />;
  },
};
