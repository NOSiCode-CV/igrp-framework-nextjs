'use client';

// import Image from 'next/image'
import Link from 'next/link';
import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPSeparatorPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPTabs,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { CopyToClipboard } from '@/components/copy-to-clipboard';
import { PageHeader } from '@/components/page-header';
import { MenuList } from '@/features/applications/components/menu-list';
import { useApplications /*useGetAppImage*/ } from '@/features/applications/hooks/use-applications';
import { formatDate } from '@/features/applications/lib/utils';
import { statusClass } from '@/lib/utils';
import { ApplicationPermissionList } from './application-permission-list';

export function ApplicationDetails({ code }: { code: string }) {
  const { data: apps, isLoading, error } = useApplications();
  // const { data: image } = useGetAppImage(id)

  if (isLoading && !error) return <div>Loading application with code: {code}</div>;
  if (error) throw error;
  if (!apps || apps.length === 0) return <div>No application with code {code} found.</div>;

  const app = apps.find((app) => app.code === code);

  if (!app) return <span>App dont exist...</span>;

  const { name, owner, type, slug, url, createdDate, description, status } = app;

  const slugLbl = type === 'INTERNAL' ? 'Slug' : 'Url';
  const slugValue = type === 'INTERNAL' ? slug : url;

  return (
    <section className='space-y-10'>
      <div className='space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <PageHeader
            title={app.name}
            showBackButton
            linkBackButton='/applications'
          >
            <IGRPButtonPrimitive asChild>
              <Link href={`/applications/${code}/edit`}>
                <IGRPIcon iconName='EditPencil' /> Editar Applicação
              </Link>
            </IGRPButtonPrimitive>
          </PageHeader>
        </div>

        <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
          <IGRPCardPrimitive className='overflow-hidden card-hover gap-3'>
            <IGRPCardHeaderPrimitive>
              <IGRPCardTitlePrimitive>Application Information</IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Detailed information about this application.
              </IGRPCardDescriptionPrimitive>
              <IGRPSeparatorPrimitive className='my-2' />
            </IGRPCardHeaderPrimitive>
            <IGRPCardContentPrimitive>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div className='flex items-center gap-4'>
                  <div>
                    <h3 className='font-normal text-muted-foreground'>Name</h3>
                    <p className='font-medium'>{name}</p>
                  </div>
                  <CopyToClipboard value={name} />
                </div>
                <div className='flex items-center gap-4'>
                  <div>
                    <h3 className='font-normal text-muted-foreground'>Code</h3>
                    <p className='font-medium'>{code}</p>
                  </div>
                  <CopyToClipboard value={code} />
                </div>
                <div>
                  <h3 className=' font-normal text-muted-foreground'>Owner</h3>
                  <p>{owner}</p>
                </div>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Status</h3>
                  <IGRPBadgePrimitive className={statusClass(status || 'ACTIVE')}>
                    {status}
                  </IGRPBadgePrimitive>
                </div>
                <div className='flex items-center gap-4'>
                  <div>
                    <h3 className='font-normal text-muted-foreground'>{slugLbl}</h3>
                    <p className='font-mono'>{slugValue}</p>
                  </div>
                  <CopyToClipboard value={slugValue || '#'} />
                </div>
                <div>
                  <div>
                    <h3 className='font-normal text-muted-foreground'>Created At</h3>
                    <p>{formatDate(createdDate || new Date().toISOString())}</p>
                  </div>
                </div>
                <div className='sm:col-span-2 md:col-span-3'>
                  <h3 className='font-normal text-muted-foreground'>Description</h3>
                  <p>{description || 'No description provided.'}</p>
                </div>
              </div>
            </IGRPCardContentPrimitive>
          </IGRPCardPrimitive>
        </div>
      </div>

      {/* <IGRPTabsPrimitive
        defaultValue='menus'
        className='space-y-4'
      >
        <IGRPTabsListPrimitive>
          <IGRPTabsTriggerPrimitive value='menus'>Menus</IGRPTabsTriggerPrimitive>
          <IGRPTabsTriggerPrimitive value='permissions'>Permissions</IGRPTabsTriggerPrimitive>
        </IGRPTabsListPrimitive>

        <IGRPTabsContentPrimitive
          value='menus'
          className='space-y-4'
        >
          <MenuList app={app} />
        </IGRPTabsContentPrimitive>

        <IGRPTabsContentPrimitive
          value='permissions'
          className='space-y-4'
        >
          <ApplicationPermissionList
            applicationId={app.id}
            applicationName={app.name}
          />
        </IGRPTabsContentPrimitive>
      </IGRPTabsPrimitive> */}
    </section>
  );
}
