import { DepartmentDetails } from '@/features/departaments/components/details';
import { use } from 'react';

export const dynamic = 'force-dynamic';

export default function DepartmentPage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = use(params);

  if (isNaN(id)) {
    return <div>Invalid department ID</div>;
  }

  return <DepartmentDetails id={id} />;
}
