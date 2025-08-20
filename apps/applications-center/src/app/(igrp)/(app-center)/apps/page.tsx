import { Suspense } from 'react';
import { ApplicationList } from '@/features/applications/components/list';
import Loading from '../loading';

// export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ApplicationList />
    </Suspense>
  );
}
