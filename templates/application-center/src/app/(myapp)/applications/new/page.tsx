'use client';

import { ApplicationForm } from '@/features/applications/components/form';
import { BackButton } from '@/components/back-button';

export const dynamic = 'force-dynamic';

export default function NewApplicationPage() {
  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <BackButton href='/applications' />
          <h2 className='text-2xl font-bold tracking-tight'>Create Application</h2>
        </div>
      </div>
      <ApplicationForm />
    </div>
  );
}
