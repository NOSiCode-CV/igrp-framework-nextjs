import Link from 'next/link';
import { IGRPButtonPrimitive, IGRPIcon } from '@igrp/igrp-framework-react-design-system';

import { siteConfig } from '@/config/site';
import { PageHeader } from '@/components/page-header';
import { ApplicationsListHome } from '@/features/applications/components/list-home';

const { texts, name } = siteConfig;

export default function Home() {
  return (
    <div className='space-y-10 animate-fade-in '>
      <PageHeader
        title={`${texts.welcome} ${name}`}
        showActions
      >
        <>
          <IGRPButtonPrimitive
            asChild
            variant='outline'
          >
            <Link href='/applications'>
              <IGRPIcon iconName="AppWindow" strokeWidth={2} /> Manage Applications
            </Link>
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive asChild>
            <Link href='/applications/new'>
              <IGRPIcon iconName="Grid2X2Plus" strokeWidth={2} /> New Application
            </Link>
          </IGRPButtonPrimitive>
        </>
      </PageHeader>

      <ApplicationsListHome />            
    </div>
  );
}
