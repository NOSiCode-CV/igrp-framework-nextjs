'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  IGRPButtonPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPInputPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { ApplicationCard } from '@/features/applications/components/card';
import { useApplications } from '@/features/applications/hooks/use-applications';
import { STATUS_OPTIONS } from '@/lib/constants';

export function ApplicationList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const { data: applications, isLoading, error } = useApplications();

  if (isLoading && !error) return <div>Carregando aplicações...</div>;
  if (error) throw error;
  if (!applications) return <div>Nenhuma aplicação encontrada...</div>;

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(app.status);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h3 className='text-3xl font-bold tracking-tight'>Gerir Aplicações</h3>
          <p className='text-muted-foreground'>Gerir Menus da Aplicação.</p>
        </div>

        <IGRPButtonPrimitive asChild>
          <Link href='/apps/new'>
            <IGRPIcon
              iconName='LayoutGrid'
              strokeWidth={2}
            />{' '}
            Nova Aplicação
          </Link>
        </IGRPButtonPrimitive>
      </div>

      <div className='flex flex-col gap-6 rounded-xl'>
        <div className='flex flex-col sm:flex-row items-start gap-4 w-full'>
          <div className='relative w-full max-w-sm'>
            <IGRPIcon
              iconName='Search'
              className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
              strokeWidth={2}
            />
            <IGRPInputPrimitive
              type='search'
              placeholder='Search applications...'
              className='w-full bg-background pl-8'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                  variant='outline'
                  className='gap-2'
                >
                  <IGRPIcon
                    iconName='ListFilter'
                    strokeWidth={2}
                  />
                  Estado {statusFilters.length > 0 && `(${statusFilters.length})`}
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive
                align='start'
                className='w-40'
              >
                <IGRPDropdownMenuSeparatorPrimitive />
                {STATUS_OPTIONS.map((status) => (
                  <IGRPDropdownMenuCheckboxItemPrimitive
                    key={status.value}
                    checked={statusFilters.includes(status.value)}
                    onCheckedChange={(checked) => {
                      setStatusFilters(
                        checked
                          ? [...statusFilters, status.value]
                          : statusFilters.filter((s) => s !== status.value),
                      );
                    }}
                  >
                    <span className='capitalize'>{status.label.toLowerCase()}</span>
                  </IGRPDropdownMenuCheckboxItemPrimitive>
                ))}
                {statusFilters.length > 0 && (
                  <>
                    <IGRPDropdownMenuSeparatorPrimitive />
                    <IGRPDropdownMenuItemPrimitive
                      onClick={() => setStatusFilters([])}
                      className='cursor-pointer hover:bg-primary hover:text-primary-foreground'
                    >
                      <IGRPIcon
                        iconName='X'
                        className='mr-1'
                        strokeWidth={2}
                      />
                      Limpar
                    </IGRPDropdownMenuItemPrimitive>
                  </>
                )}
              </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className='text-center py-6 text-muted-foreground'>
            Nenhuma aplicação encontrada. Tente ajustar a sua pesquisa ou filtros.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filteredApps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
