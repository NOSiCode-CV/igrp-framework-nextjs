'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionCreateDialog } from '@/features/permission/components/create-dialog';
import { PermissionTable } from '@/features/permission/components/table';
import { useAllPermissions } from '@/features/permission/hooks/use-permission';
import { useApplications } from '@/features/applications/hooks/use-applications';

export function PermissionList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [applicationFilter, setApplicationFilter] = useState<string[]>([]);

  const { data: permissions, isLoading, error, refetch } = useAllPermissions();
  const { data: applications } = useApplications();

  const appIds =
    permissions && applications
      ? Array.from(new Set(permissions.map((perm) => perm.applicationId?.toString() || 'None')))
      : [];

  const statuses = ['ACTIVE', 'INACTIVE'];

  if (isLoading || !permissions) {
    return (
      <div className='grid gap-4 animate-pulse'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='h-12 rounded-lg bg-muted'
          />
        ))}
      </div>
    );
  }

  if (error) throw error;

  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch =
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(perm.status);

    const matchesApp =
      applicationFilter.length === 0 ||
      applicationFilter.includes(perm.applicationId?.toString() || 'None');

    return matchesSearch && matchesStatus && matchesApp;
  });

  const activePerms = filteredPermissions.filter((perm) => perm.status === 'ACTIVE');
  const inactivePerms = filteredPermissions.filter((perm) => perm.status === 'INACTIVE');

  const handlePermissionCreated = () => {
    refetch();
  };

  const getAppName = (appId: number) => {
    return applications?.find((app) => app.id === appId)?.name || `App ${appId}`;
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Permission Management</h1>
          <p className='text-muted-foreground'>Manage permissions and their applications.</p>
        </div>
        <PermissionCreateDialog onSuccess={handlePermissionCreated} />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 mt-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search permissions...'
            className='w-full bg-background pl-8'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              className='gap-2'
            >
              <Filter className='h-4 w-4' /> Filter Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-40'
          >
            {statuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, status]);
                  } else {
                    setStatusFilter(statusFilter.filter((s) => s !== status));
                  }
                }}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {appIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='gap-2'
              >
                <Filter className='h-4 w-4' /> Filter Application
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-40'
            >
              {appIds.map((appId) => (
                <DropdownMenuCheckboxItem
                  key={appId}
                  checked={applicationFilter.includes(appId)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setApplicationFilter([...applicationFilter, appId]);
                    } else {
                      setApplicationFilter(applicationFilter.filter((c) => c !== appId));
                    }
                  }}
                >
                  {appId === 'None' ? 'None' : getAppName(parseInt(appId))}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Tabs
        defaultValue='all'
        className='space-y-4'
      >
        <TabsList>
          <TabsTrigger value='all'>All ({filteredPermissions.length})</TabsTrigger>
          <TabsTrigger value='active'>Active ({activePerms.length})</TabsTrigger>
          <TabsTrigger value='inactive'>Inactive ({inactivePerms.length})</TabsTrigger>
        </TabsList>

        <TabsContent
          value='all'
          className='space-y-4'
        >
          {filteredPermissions.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No permissions found. Try adjusting your search or filters.
            </div>
          ) : (
            <PermissionTable
              permissions={filteredPermissions}
              applications={applications || []}
            />
          )}
        </TabsContent>

        <TabsContent
          value='active'
          className='space-y-4'
        >
          {activePerms.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No active permissions found. Try adjusting your search or filters.
            </div>
          ) : (
            <PermissionTable
              permissions={activePerms}
              applications={applications || []}
            />
          )}
        </TabsContent>

        <TabsContent
          value='inactive'
          className='space-y-4'
        >
          {inactivePerms.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No inactive permissions found. Try adjusting your search or filters.
            </div>
          ) : (
            <PermissionTable
              permissions={inactivePerms}
              applications={applications || []}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
