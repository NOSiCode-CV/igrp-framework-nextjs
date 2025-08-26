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
  IGRPTabItem,
} from '@igrp/igrp-framework-react-design-system';
import { CopyToClipboard } from '@/components/copy-to-clipboard';
import { PageHeader } from '@/components/page-header';
import { MenuList } from '@/features/applications/components/menu-list';
import { useApplicationByCode, useApplications /*useGetAppImage*/ } from '@/features/applications/hooks/use-applications';
import { formatDate } from '@/features/applications/lib/utils';
import { statusClass } from '@/lib/utils';
import { ApplicationPermissionList } from './application-permission-list';
import { ROUTES } from '@/lib/constants';
import { AppCenterLoading } from '@/components/loading';
import { AppCenterNotFound } from '@/components/not-found';
import { ButtonLink } from '@/components/button-link';

export function ApplicationDetails({ code }: { code: string }) {
  const { data: app, isLoading, error } = useApplicationByCode(code);
  // const { data: image } = useGetAppImage(id)

  if (isLoading && !error) return <AppCenterLoading descrption='A carregar aplicação através do código...' />;

  if (error) throw error;
  if (!app) {
    return (
      <AppCenterNotFound
        iconName='AppWindow'
        title='Nenhuma aplicação encontrada.'
      />
    );
  }

  const { name, owner, type, slug, url, createdDate, description, status } = app;

  const slugLbl = type === 'INTERNAL' ? 'Slug' : 'Url';
  const slugValue = type === 'INTERNAL' ? slug : url;

  const tabItems: IGRPTabItem[] = [
    {
      label: 'Menus',
      value: 'menus',
      content: <MenuList app={app} />,
    },
    {
      label: 'Permissões',
      value: 'permissions',
      content: <ApplicationPermissionList applicationId={app.id}  applicationName={app.name} />,
    }
  ]

  return (
    <section className='space-y-10'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <PageHeader
            title={app.name}
            showBackButton
            linkBackButton={ROUTES.APPS}
          >
            <ButtonLink
              href={`${ROUTES.APPS}/${code}/editar`}
              label='Editar Aplicação'
              icon='EditPencil'
            />   
          </PageHeader>
        </div>

        <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
          <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
            <IGRPCardHeaderPrimitive>
              <IGRPCardTitlePrimitive>Informação da Aplicação</IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Informações detalhadas da aplicação.
              </IGRPCardDescriptionPrimitive>
              <IGRPSeparatorPrimitive className='my-2' />
            </IGRPCardHeaderPrimitive>
            <IGRPCardContentPrimitive className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm'>
              <div className='flex items-center gap-4'>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Nome</h3>
                  <p className='font-medium'>{name}</p>
                </div>
                <CopyToClipboard value={name} />
              </div>
              <div className='flex items-center gap-4'>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Código</h3>
                  <p className='font-medium'>{code}</p>
                </div>
                <CopyToClipboard value={code} />
              </div>
              <div>
                <h3 className=' font-normal text-muted-foreground'>Proprietário</h3>
                <p>{owner}</p>
              </div>
              <div>
                <h3 className='font-normal text-muted-foreground'>Estado</h3>
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
                  <h3 className='font-normal text-muted-foreground'>Criado em</h3>
                  <p>{formatDate(createdDate || new Date().toISOString())}</p>
                </div>
              </div>
              <div>
                <h3 className='font-normal text-muted-foreground'>Descrição</h3>
                <p>{description || 'Sem descrição.'}</p>
              </div>
            </IGRPCardContentPrimitive>
          </IGRPCardPrimitive>
        </div>
      </div>

      <IGRPTabs
        defaultValue='menus'
        className='space-y-4' 
        items={tabItems}      
      />        
    </section>
  );
}
