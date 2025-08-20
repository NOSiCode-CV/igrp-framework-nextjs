import { ButtonLink } from '@/components/button-link';
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
        <ButtonLink
          href={ROUTES.APPS}
          label='Gerir Aplicação'
          iconName='AppWindow'
          variant='outline'
        />

        <ButtonLink
          href={ROUTES.NEW_APPS}
          label='Nova Aplicação'
          iconName='LayoutGrid'
        />
      </PageHeader>

      <ApplicationsListHome />
    </div>
  );
}
