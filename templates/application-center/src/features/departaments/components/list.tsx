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
import { DepartmentCreateDialog } from '@/features/departaments/components/create-dialog';
import { DepartmentTable } from '@/features/departaments/components/table';
import { useAllDepartments } from '../hooks/use-departments';

export function DepartmentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [applicationFilter, setApplicationFilter] = useState<string[]>([]);

  const { data: departments, isLoading, error, refetch } = useAllDepartments();

  const appIds = departments
    ? Array.from(new Set(departments.map((dept) => dept.application_id?.toString() || 'None')))
    : [];

  const statuses = ['ACTIVE', 'INACTIVE'];

  if (isLoading || !departments) {
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

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(dept.status);

    const matchesApp =
      applicationFilter.length === 0 ||
      applicationFilter.includes(dept.application_id?.toString() || 'None');

    return matchesSearch && matchesStatus && matchesApp;
  });

  const activeDepts = filteredDepartments.filter((dept) => dept.status === 'ACTIVE');
  const inactiveDepts = filteredDepartments.filter((dept) => dept.status === 'INACTIVE');

  const handleDepartmentCreated = () => {
    refetch();
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Department Management</h1>
          <p className='text-muted-foreground'>Manage departments and their permissions.</p>
        </div>
        <DepartmentCreateDialog onSuccess={handleDepartmentCreated} />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 mt-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search departments...'
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
                  {appId === 'None' ? 'None' : `App ${appId}`}
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
          <TabsTrigger value='all'>All ({filteredDepartments.length})</TabsTrigger>
          <TabsTrigger value='active'>Active ({activeDepts.length})</TabsTrigger>
          <TabsTrigger value='inactive'>Inactive ({inactiveDepts.length})</TabsTrigger>
        </TabsList>

        <TabsContent
          value='all'
          className='space-y-4'
        >
          {filteredDepartments.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No departments found. Try adjusting your search or filters.
            </div>
          ) : (
            <DepartmentTable departments={filteredDepartments} />
          )}
        </TabsContent>

        <TabsContent
          value='active'
          className='space-y-4'
        >
          {activeDepts.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No active departments found. Try adjusting your search or filters.
            </div>
          ) : (
            <DepartmentTable departments={activeDepts} />
          )}
        </TabsContent>

        <TabsContent
          value='inactive'
          className='space-y-4'
        >
          {inactiveDepts.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No inactive departments found. Try adjusting your search or filters.
            </div>
          ) : (
            <DepartmentTable departments={inactiveDepts} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
