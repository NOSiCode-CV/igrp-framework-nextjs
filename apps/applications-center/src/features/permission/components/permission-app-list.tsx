'use client';

import { useState } from 'react';
import {
  IGRPButtonPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';

import { PermissionTable } from '@/features/permission/components/table';
import { PermissionCreateDialog } from '@/features/permission/components/create-dialog';
import { usePermissionsByApplication } from '@/features/permission/hooks/use-permission';
import { STATUS_OPTIONS } from '@/lib/constants';

interface PermissionAppListProps {
  departmentCode: string;
}

export function PermissionAppList({ departmentCode }: PermissionAppListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: permissions, isLoading, error, refetch } = usePermissionsByApplication(appCode);

  if (isLoading) {
    return (
      <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
        <IGRPCardHeaderPrimitive>
          <IGRPCardTitlePrimitive>Permissões da aplicação</IGRPCardTitlePrimitive>
          <IGRPCardDescriptionPrimitive>
            A carregar permissões para {appName}...
          </IGRPCardDescriptionPrimitive>
        </IGRPCardHeaderPrimitive>
        <IGRPCardContentPrimitive>
          <div className='grid gap-4 animate-pulse'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='h-12 rounded-lg bg-muted'
              />
            ))}
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>
    );
  }

  if (error) throw error;

  const filteredPermissions =
    permissions?.filter((perm) => {
      const matchesSearch =
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(perm.status);

      return matchesSearch && matchesStatus;
    }) || [];

  const handlePermissionCreated = () => {
    refetch();
    setCreateDialogOpen(false);
  };

  return (
    <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
      <IGRPCardHeaderPrimitive>
        <div className='flex items-center justify-between'>
          <div>
            <IGRPCardTitlePrimitive>Permissões da aplicação</IGRPCardTitlePrimitive>
            <IGRPCardDescriptionPrimitive>
              Manage permissions for {appName} ({filteredPermissions.length} permissions)
            </IGRPCardDescriptionPrimitive>
          </div>
          {filteredPermissions.length > 0 && (
            <IGRPButtonPrimitive onClick={() => setCreateDialogOpen(true)}>
              <IGRPIcon
                iconName='Plus'
                className='mr-2'
              />
              New Permission
            </IGRPButtonPrimitive>
          )}
        </div>
      </IGRPCardHeaderPrimitive>

      <IGRPCardContentPrimitive className='flex flex-col gap-4 rounded-md border'>
        {filteredPermissions.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            {permissions?.length === 0 ? (
              <div>
                <p className='mb-2'>Nenhuma permissão encontrada para está aplicação</p>
                <IGRPButtonPrimitive
                  onClick={() => setCreateDialogOpen(true)}
                  variant='outline'
                >
                  <IGRPIcon
                    iconName='Plus'
                    className='mr-2 size-4'
                  />
                  Criar Nova Permissão
                </IGRPButtonPrimitive>
              </div>
            ) : (
              'Nenhuma permissão corresponde aos seus critérios de pesquisa.'
            )}
          </div>
        ) : (
          <>
            <div className='flex flex-col sm:flex-row gap-2'>
              <div className='relative flex-1'>
                <IGRPIcon
                  iconName='Search'
                  className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
                />
                <IGRPInputPrimitive
                  type='search'
                  placeholder='Pesquisar PErmissões...'
                  className='w-full bg-background pl-8'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <IGRPDropdownMenuPrimitive>
                <IGRPDropdownMenuTriggerPrimitive asChild>
                  <IGRPButtonPrimitive
                    variant='outline'
                    className='gap-2'
                  >
                    <IGRPIcon iconName='Filter' />
                    Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
                  </IGRPButtonPrimitive>
                </IGRPDropdownMenuTriggerPrimitive>
                <IGRPDropdownMenuContentPrimitive
                  align='end'
                  className='w-40'
                >
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <IGRPDropdownMenuCheckboxItemPrimitive
                      key={value}
                      checked={statusFilter.includes(value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter([...statusFilter, value]);
                        } else {
                          setStatusFilter(statusFilter.filter((s) => s !== value));
                        }
                      }}
                    >
                      {label}
                    </IGRPDropdownMenuCheckboxItemPrimitive>
                  ))}
                </IGRPDropdownMenuContentPrimitive>
              </IGRPDropdownMenuPrimitive>
            </div>
            <PermissionTable
              permissions={filteredPermissions}
              onRefresh={refetch}
              hideApplicationColumn={true}
            />
          </>
        )}

        <PermissionCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handlePermissionCreated}
          defaultAppCode={appCode}
        />
      </IGRPCardContentPrimitive>
    </IGRPCardPrimitive>
  );
}
