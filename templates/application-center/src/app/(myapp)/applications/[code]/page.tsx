import { ApplicationDetails } from '@/features/applications/components/details';

export const dynamic = 'force-dynamic';

export default async function ApplicationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ApplicationDetails code={code} />;
}
