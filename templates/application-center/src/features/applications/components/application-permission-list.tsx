'use client';

import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionTable } from '@/features/permission/components/table';
import { PermissionCreateDialog } from '@/features/permission/components/create-dialog';
import { usePermissionsByApplication } from '@/features/permission/hooks/use-permission';

interface ApplicationPermissionListProps {
  applicationId: number;
  applicationName: string;
}

export function ApplicationPermissionList({
  applicationId,
  applicationName,
}: ApplicationPermissionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    data: permissions,
    isLoading,
    error,
    refetch,
  } = usePermissionsByApplication(applicationId);

  const statuses = ['ACTIVE', 'INACTIVE'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Permissions</CardTitle>
          <CardDescription>Loading permissions for {applicationName}...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 animate-pulse'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='h-12 rounded-lg bg-muted'
              />
            ))}
          </div>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Application Permissions</CardTitle>
            <CardDescription>
              Manage permissions for {applicationName} ({filteredPermissions.length} permissions)
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Permission
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-col sm:flex-row gap-2'>
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
                <Filter className='h-4 w-4' />
                Status {statusFilter.length > 0 && `(${statusFilter.length})`}
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
        </div>

        {filteredPermissions.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            {permissions?.length === 0 ? (
              <div>
                <p className='mb-2'>No permissions found for this application.</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant='outline'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create First Permission
                </Button>
              </div>
            ) : (
              'No permissions match your search criteria.'
            )}
          </div>
        ) : (
          <PermissionTable
            permissions={filteredPermissions}
            applications={[]} // Não precisa mostrar aplicação pois já estamos no contexto
            onRefresh={refetch}
            hideApplicationColumn={true}
          />
        )}

        <PermissionCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handlePermissionCreated}
          defaultApplicationId={applicationId}
        />
      </CardContent>
    </Card>
  );
}
