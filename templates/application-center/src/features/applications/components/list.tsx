'use client';

import { useState } from 'react';
import { Search, ListFilter, Grid2X2Plus, X } from 'lucide-react';
import Link from 'next/link';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { ApplicationCard } from '@/features/applications/components/card';
import { useApplications } from '@/features/applications/hooks/use-applications';

export function ApplicationList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const { data: applications, isLoading, error } = useApplications();

  if (isLoading && !error) return <div>Loading applications...</div>;
  if (error) throw error;
  if (!applications) return <div>No applications found...</div>;

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
          <h3 className='text-3xl font-bold tracking-tight'>Application Management</h3>
          <p className='text-muted-foreground'>Manage your applications and their menus.</p>
        </div>

        <Button asChild>
          <Link href='/applications/new'>
            <Grid2X2Plus strokeWidth={2} /> New Application
          </Link>
        </Button>
      </div>

      <div className='flex flex-col gap-6 rounded-xl'>
        <div className='flex flex-col sm:flex-row items-start gap-4 w-full'>
          <div className='relative w-full max-w-sm'>
            <Search
              className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
              strokeWidth={2}
            />
            <Input
              type='search'
              placeholder='Search applications...'
              className='w-full bg-background pl-8'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='gap-2'
                >
                  <ListFilter strokeWidth={2} />
                  Status {statusFilters.length > 0 && `(${statusFilters.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='start'
                className='w-40'
              >
                <DropdownMenuSeparator />
                {['ACTIVE', 'INACTIVE'].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.includes(status)}
                    onCheckedChange={(checked) => {
                      setStatusFilters(
                        checked
                          ? [...statusFilters, status]
                          : statusFilters.filter((s) => s !== status),
                      );
                    }}
                  >
                    <span className='capitalize'>{status.toLowerCase()}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setStatusFilters([])}
                      className='cursor-pointer hover:bg-primary hover:text-primary-foreground'
                    >
                      <X
                        className='mr-1'
                        strokeWidth={2}
                      />
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className='text-center py-6 text-muted-foreground'>
            No applications found. Try adjusting your search or filters.
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
