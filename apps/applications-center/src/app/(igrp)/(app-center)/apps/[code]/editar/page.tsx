'use client';
import { use } from 'react';
import { BackButton } from '@/components/back-button';
import { ApplicationForm } from '@/features/applications/components/form';
import { useApplications } from '@/features/applications/hooks/use-applications';

export const dynamic = 'force-dynamic';

export default function EditApplicationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data: apps, isLoading: appsLoading, error: fetchError } = useApplications();

  if (!apps || appsLoading) return <span>Loading...</span>;

  if (fetchError) return <div>Error...</div>;

  const app = apps.find((app) => app.code === code);

  if (!app) return <span>App dont exist...</span>;
  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <BackButton href={`/applications/${code}`} />
          <h1 className='text-3xl font-bold tracking-tight'>Edit Application</h1>
        </div>
      </div>
      <ApplicationForm application={app} />
    </div>
  );
}
