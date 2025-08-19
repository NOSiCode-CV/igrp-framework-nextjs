import Link from 'next/link';
import { IGRPButtonPrimitive, IGRPIcon } from '@igrp/igrp-framework-react-design-system';

import { PageHeader } from '@/components/page-header';
import { ApplicationsListHome } from '@/features/applications/components/list-home';
import { ROUTES } from '@/lib/constants';

const appName = process.env.IGRP_APP_NAME_DESCRIPTION || 'IGRP';

export default function Home() {
  return (
    <div className='space-y-10 animate-fade-in'>
      <PageHeader
        title={`Bem-vindo ao ${appName}`}
        showActions
      >
        <IGRPButtonPrimitive asChild variant='outline'>
          <Link href={ROUTES.APPS}>
            <IGRPIcon iconName='AppWindow'strokeWidth={2} />
            Gerir Aplicações
          </Link>
        </IGRPButtonPrimitive>
        <IGRPButtonPrimitive asChild>
          <Link href={ROUTES.NEW_APPS}>
            <IGRPIcon iconName='LayoutGrid' strokeWidth={2} />
            Nova Applicação
          </Link>
        </IGRPButtonPrimitive>
      </PageHeader>

      <ApplicationsListHome />
    </div>
  );
}
