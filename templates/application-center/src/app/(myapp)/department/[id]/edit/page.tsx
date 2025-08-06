import { DepartmentEditForm } from '@/features/departaments/components/edit-form';
import { use } from 'react';

export const dynamic = 'force-dynamic';

export default function DepartmentEditPage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = use(params);

  if (isNaN(id)) {
    return <div>Invalid department ID</div>;
  }

  return <DepartmentEditForm id={id} />;
}
