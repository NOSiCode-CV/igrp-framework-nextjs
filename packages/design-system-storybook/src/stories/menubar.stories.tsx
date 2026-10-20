import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  IGRPMenubar,
  IGRPMenubarMenu,
  IGRPMenubarTrigger,
  IGRPMenubarContent,
  IGRPMenubarItem,
  IGRPMenubarSeparator,
  IGRPMenubarLabel,
  IGRPMenubarShortcut,
  IGRPMenubarCheckboxItem,
  IGRPMenubarRadioGroup,
  IGRPMenubarRadioItem,
  IGRPMenubarSub,
  IGRPMenubarSubTrigger,
  IGRPMenubarSubContent,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Menubar',
  component: IGRPMenubar,
} satisfies Meta<typeof IGRPMenubar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A desktop-style application menubar with File / Edit / View menus, shortcuts, a submenu and toggles. */
export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [showStatusBar, setShowStatusBar] = useState(true);
      const [profile, setProfile] = useState('benoit');
      return (
        <div className='p-6'>
          <IGRPMenubar>
            <IGRPMenubarMenu>
              <IGRPMenubarTrigger>File</IGRPMenubarTrigger>
              <IGRPMenubarContent>
                <IGRPMenubarItem>
                  New Tab <IGRPMenubarShortcut>⌘T</IGRPMenubarShortcut>
                </IGRPMenubarItem>
                <IGRPMenubarItem>
                  New Window <IGRPMenubarShortcut>⌘N</IGRPMenubarShortcut>
                </IGRPMenubarItem>
                <IGRPMenubarSeparator />
                <IGRPMenubarSub>
                  <IGRPMenubarSubTrigger>Share</IGRPMenubarSubTrigger>
                  <IGRPMenubarSubContent>
                    <IGRPMenubarItem>Email link</IGRPMenubarItem>
                    <IGRPMenubarItem>Messages</IGRPMenubarItem>
                  </IGRPMenubarSubContent>
                </IGRPMenubarSub>
                <IGRPMenubarSeparator />
                <IGRPMenubarItem>
                  Print… <IGRPMenubarShortcut>⌘P</IGRPMenubarShortcut>
                </IGRPMenubarItem>
              </IGRPMenubarContent>
            </IGRPMenubarMenu>

            <IGRPMenubarMenu>
              <IGRPMenubarTrigger>Edit</IGRPMenubarTrigger>
              <IGRPMenubarContent>
                <IGRPMenubarItem>
                  Undo <IGRPMenubarShortcut>⌘Z</IGRPMenubarShortcut>
                </IGRPMenubarItem>
                <IGRPMenubarItem>
                  Redo <IGRPMenubarShortcut>⇧⌘Z</IGRPMenubarShortcut>
                </IGRPMenubarItem>
              </IGRPMenubarContent>
            </IGRPMenubarMenu>

            <IGRPMenubarMenu>
              <IGRPMenubarTrigger>View</IGRPMenubarTrigger>
              <IGRPMenubarContent>
                <IGRPMenubarCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
                  Always Show Status Bar
                </IGRPMenubarCheckboxItem>
                <IGRPMenubarSeparator />
                <IGRPMenubarLabel>Profiles</IGRPMenubarLabel>
                <IGRPMenubarRadioGroup value={profile} onValueChange={setProfile}>
                  <IGRPMenubarRadioItem value='andy'>Andy</IGRPMenubarRadioItem>
                  <IGRPMenubarRadioItem value='benoit'>Benoit</IGRPMenubarRadioItem>
                  <IGRPMenubarRadioItem value='luis'>Luis</IGRPMenubarRadioItem>
                </IGRPMenubarRadioGroup>
              </IGRPMenubarContent>
            </IGRPMenubarMenu>
          </IGRPMenubar>
        </div>
      );
    };
    return <Demo />;
  },
};
