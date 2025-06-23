import { IGRPThemeSelector } from '@igrp/framework-next';

export default function SettingsPage() {
  return (
    <section className='space-y-6 animate-fade-in'>
      <div>System Settings</div>
      <IGRPThemeSelector />
    </section>
  );
}
