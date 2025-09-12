'use client';

import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPSeparatorPrimitive,
  IGRPBadge,
  cn,
  IGRPBadgePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { PageHeader } from '@/components/page-header';
import { ROUTES } from '@/lib/constants';
import { AppCenterLoading } from '@/components/loading';
import { AppCenterNotFound } from '@/components/not-found';
import { CopyToClipboard } from '@/components/copy-to-clipboard';
import { useRoleByName } from '../use-roles';
import { showStatus, statusClass } from '@/lib/utils';

interface RoleDetailsProps {
  departmentCode: string; 
  name: string 
}

export function RoleDetails({ departmentCode, name }: RoleDetailsProps) {
  
  const { data: role, isLoading, error } = useRoleByName(name);  

  if (isLoading) return <AppCenterLoading descrption={`A carregar perfil ${name}...` } />;

  if (error) throw error;

  if (!role) {
    return (
      <AppCenterNotFound
        iconName='AppWindow'
        title='Nenhum Perfil encontrado.'
      />
    );
  }  

  const { description, parentName, status } = role;

  return (
    <div className='flex-1 p-4 min-w-0 overflow-x-hidden'>
      <section className='space-y-10 max-w-full'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <PageHeader
              title={name}
              showBackButton
              linkBackButton={`${ROUTES.DEPARTMENTS}/${departmentCode}`}
            />
          </div>

          <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
            <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
              <IGRPCardHeaderPrimitive>
                <IGRPCardTitlePrimitive>Informação de Perfil</IGRPCardTitlePrimitive>
                <IGRPCardDescriptionPrimitive>
                  Informações detalhadas do perfil.
                </IGRPCardDescriptionPrimitive>
                <IGRPSeparatorPrimitive className='my-2' />
              </IGRPCardHeaderPrimitive>
              <IGRPCardContentPrimitive>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                  <div className='flex items-center gap-4'>
                    <div className='flex flex-col'>
                      <h3 className='font-normal text-muted-foreground'>Nome</h3>
                      <p className='font-medium text-base'>{name}</p>
                    </div>
                    <CopyToClipboard value={name} />
                  </div>

                  <div>
                    <h3 className='font-normal text-muted-foreground'>Descrição</h3>
                    <p>{description || 'N/A'}</p>
                  </div>

                  <div className='flex items-center gap-4'>
                    <div>
                      <h3 className='font-normal text-muted-foreground'>Código departamento</h3>
                      <p className='font-medium'>{departmentCode}</p>
                    </div>
                    <CopyToClipboard value={departmentCode} />
                  </div>

                  {parentName && (
                    <div className='flex items-center gap-4'>
                      <div>
                        <h3 className='font-normal text-muted-foreground'>Perfil Pai</h3>
                        <p className='font-medium'>{parentName}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className='font-normal text-muted-foreground'>Estado</h3>
                    <IGRPBadgePrimitive className={cn(statusClass(status), 'capitalize')}>
            {showStatus(status)}
            
          </IGRPBadgePrimitive>
                  </div>                       
                </div>
              </IGRPCardContentPrimitive>
            </IGRPCardPrimitive>
          </div>
        </div>        
      </section>
    </div>
  );
}
