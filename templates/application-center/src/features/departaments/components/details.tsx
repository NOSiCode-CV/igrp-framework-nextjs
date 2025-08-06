'use client';

import Link from 'next/link';
import { Edit } from 'lucide-react';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IGRPSeparatorPrimitive, } from '@igrp/igrp-framework-react-design-system'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { RolesList } from '@/features/roles/components/role-create-dialog';
import { useCurrentDepartment } from '../hooks/use-departments';

export function DepartmentDetails({ id }: { id: number }) {
  const { data: department, isLoading, error } = useCurrentDepartment(id);

  if (isLoading) return <div>Loading department...</div>;
  if (error) throw error;
  if (!department) return <div>Department not found.</div>;

  return (
    <section className='space-y-10'>
      <div className='space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <PageHeader
            title={department.name}
            showBackButton
            linkBackButton='/department'
          >
            <Button asChild>
              <Link href={`/department/${id}/edit`}>
                <Edit /> Edit Department
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
          <Card className='overflow-hidden card-hover gap-3'>
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
              <CardDescription>Detailed information about this department.</CardDescription>
              <Separator className='my-2' />
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Name</h3>
                  <p className='font-medium'>{department.name}</p>
                </div>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Code</h3>
                  <p className='font-medium'>{department.code}</p>
                </div>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Status</h3>
                  <Badge variant={department.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {department.status}
                  </Badge>
                </div>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Application ID</h3>
                  <p>{department.application_id || 'N/A'}</p>
                </div>
                <div className='sm:col-span-2 md:col-span-3'>
                  <h3 className='font-normal text-muted-foreground'>Description</h3>
                  <p>{department.description || 'No description provided.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs
        defaultValue='roles'
        className='space-y-4'
      >
        <TabsList>
          <TabsTrigger value='roles'>Roles</TabsTrigger>
        </TabsList>

        <TabsContent
          value='roles'
          className='space-y-4'
        >
          <Card>
            <CardHeader>
              <CardTitle>Department Roles</CardTitle>
              <CardDescription>Manage roles and permissions for this department.</CardDescription>
            </CardHeader>
            <CardContent>
              <RolesList
                departmentId={department.id}
                applicationId={department.application_id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
