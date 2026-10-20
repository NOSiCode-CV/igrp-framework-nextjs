import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  IGRPDropdownMenu,
  IGRPDropdownMenuTrigger,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuGroup,
  IGRPDropdownMenuLabel,
  IGRPDropdownMenuItem,
  IGRPDropdownMenuCheckboxItem,
  IGRPDropdownMenuRadioGroup,
  IGRPDropdownMenuRadioItem,
  IGRPDropdownMenuSeparator,
  IGRPDropdownMenuShortcut,
  IGRPDropdownMenuSub,
  IGRPDropdownMenuSubTrigger,
  IGRPDropdownMenuSubContent,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/DropdownMenu',
  component: IGRPDropdownMenu,
} satisfies Meta<typeof IGRPDropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Typical account menu: a label, grouped items with shortcuts, a separator and a destructive action. */
export const Default: Story = {
  render: () => (
    <div className='p-6'>
      <IGRPDropdownMenu>
        <IGRPDropdownMenuTrigger asChild>
          <IGRPButton variant='outline'>Open menu</IGRPButton>
        </IGRPDropdownMenuTrigger>
        <IGRPDropdownMenuContent className='w-56'>
          <IGRPDropdownMenuLabel>My Account</IGRPDropdownMenuLabel>
          <IGRPDropdownMenuSeparator />
          <IGRPDropdownMenuGroup>
            <IGRPDropdownMenuItem>
              Profile
              <IGRPDropdownMenuShortcut>⇧⌘P</IGRPDropdownMenuShortcut>
            </IGRPDropdownMenuItem>
            <IGRPDropdownMenuItem>
              Settings
              <IGRPDropdownMenuShortcut>⌘S</IGRPDropdownMenuShortcut>
            </IGRPDropdownMenuItem>
          </IGRPDropdownMenuGroup>
          <IGRPDropdownMenuSeparator />
          <IGRPDropdownMenuItem variant='destructive'>
            Log out
            <IGRPDropdownMenuShortcut>⇧⌘Q</IGRPDropdownMenuShortcut>
          </IGRPDropdownMenuItem>
        </IGRPDropdownMenuContent>
      </IGRPDropdownMenu>
    </div>
  ),
};

/** Checkbox items for toggling boolean options. */
export const WithCheckboxes: Story = {
  render: () => {
    const Demo = () => {
      const [statusBar, setStatusBar] = useState(true);
      const [activityBar, setActivityBar] = useState(false);
      const [panel, setPanel] = useState(false);
      return (
        <div className='p-6'>
          <IGRPDropdownMenu>
            <IGRPDropdownMenuTrigger asChild>
              <IGRPButton variant='outline'>View</IGRPButton>
            </IGRPDropdownMenuTrigger>
            <IGRPDropdownMenuContent className='w-56'>
              <IGRPDropdownMenuLabel>Appearance</IGRPDropdownMenuLabel>
              <IGRPDropdownMenuSeparator />
              <IGRPDropdownMenuCheckboxItem checked={statusBar} onCheckedChange={setStatusBar}>
                Status Bar
              </IGRPDropdownMenuCheckboxItem>
              <IGRPDropdownMenuCheckboxItem checked={activityBar} onCheckedChange={setActivityBar}>
                Activity Bar
              </IGRPDropdownMenuCheckboxItem>
              <IGRPDropdownMenuCheckboxItem checked={panel} onCheckedChange={setPanel}>
                Panel
              </IGRPDropdownMenuCheckboxItem>
            </IGRPDropdownMenuContent>
          </IGRPDropdownMenu>
        </div>
      );
    };
    return <Demo />;
  },
};

/** Radio group for selecting a single option. */
export const WithRadioGroup: Story = {
  render: () => {
    const Demo = () => {
      const [position, setPosition] = useState('bottom');
      return (
        <div className='p-6'>
          <IGRPDropdownMenu>
            <IGRPDropdownMenuTrigger asChild>
              <IGRPButton variant='outline'>Panel position</IGRPButton>
            </IGRPDropdownMenuTrigger>
            <IGRPDropdownMenuContent className='w-56'>
              <IGRPDropdownMenuLabel>Position</IGRPDropdownMenuLabel>
              <IGRPDropdownMenuSeparator />
              <IGRPDropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                <IGRPDropdownMenuRadioItem value='top'>Top</IGRPDropdownMenuRadioItem>
                <IGRPDropdownMenuRadioItem value='bottom'>Bottom</IGRPDropdownMenuRadioItem>
                <IGRPDropdownMenuRadioItem value='right'>Right</IGRPDropdownMenuRadioItem>
              </IGRPDropdownMenuRadioGroup>
            </IGRPDropdownMenuContent>
          </IGRPDropdownMenu>
        </div>
      );
    };
    return <Demo />;
  },
};

/** Nested submenu. */
export const WithSubmenu: Story = {
  render: () => (
    <div className='p-6'>
      <IGRPDropdownMenu>
        <IGRPDropdownMenuTrigger asChild>
          <IGRPButton variant='outline'>Actions</IGRPButton>
        </IGRPDropdownMenuTrigger>
        <IGRPDropdownMenuContent className='w-56'>
          <IGRPDropdownMenuItem>New File</IGRPDropdownMenuItem>
          <IGRPDropdownMenuSub>
            <IGRPDropdownMenuSubTrigger>Share</IGRPDropdownMenuSubTrigger>
            <IGRPDropdownMenuSubContent>
              <IGRPDropdownMenuItem>Email</IGRPDropdownMenuItem>
              <IGRPDropdownMenuItem>Copy link</IGRPDropdownMenuItem>
              <IGRPDropdownMenuItem>Messages</IGRPDropdownMenuItem>
            </IGRPDropdownMenuSubContent>
          </IGRPDropdownMenuSub>
          <IGRPDropdownMenuSeparator />
          <IGRPDropdownMenuItem>Archive</IGRPDropdownMenuItem>
        </IGRPDropdownMenuContent>
      </IGRPDropdownMenu>
    </div>
  ),
};
