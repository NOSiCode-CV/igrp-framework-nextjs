import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { ApplicationList } from '@/features/applications/components/app-list';
import { ROUTES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  return <ApplicationList />  
}
