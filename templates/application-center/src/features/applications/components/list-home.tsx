'use client';

import { Fragment } from 'react';
import { ApplicationCard } from '@/features/applications/components/card';
import { useApplications } from '@/features/applications/hooks/use-applications';

// TODO: use recent applications and messages
export function ApplicationsListHome() {
  const { data: applications, isLoading, error } = useApplications();

  if (isLoading && !error) return <div>Loading applications...</div>;
  if (error) throw error;
  if (!applications || applications.length === 0) return <div>No applications found.</div>;

  const activeApps = applications.filter((app) => app.status === 'ACTIVE').slice(0, 6);

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {activeApps.map((app) => {
        return (
          <Fragment key={app.id}>
            <ApplicationCard app={app} />
          </Fragment>
        );
      })}
    </div>
  );
}
