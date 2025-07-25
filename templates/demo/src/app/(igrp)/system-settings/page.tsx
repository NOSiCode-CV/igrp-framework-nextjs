"use client"

import { IGRPTemplateThemeSelector } from '@igrp/framework-next-design-system';
import { IGRPButton, useIGRPToast } from '@igrp/framework-next-design-system';

export default function SettingsPage() {

  const { igrpToast } = useIGRPToast();

  const handlerButton = () => {
    console.log("Clicked...");
    igrpToast({
      type: 'info',
      title: 'Info!',
      description: <span className='text-foreground'>This is a info message.</span>,
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
      },
    })
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      <IGRPTemplateThemeSelector />
      <IGRPButton onClick={() => handlerButton()}>
        Info
      </IGRPButton>
    </div >
  );
}
