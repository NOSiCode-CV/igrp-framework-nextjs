'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPCardPrimitive, IGRPCardContentPrimitive, IGRPCardFooterPrimitive, IGRPCardHeaderPrimitive, IGRPCardTitlePrimitive} from '@igrp/igrp-framework-react-design-system'

import { IGRPFormPrimitive, IGRPFormControlPrimitive, IGRPFormDescriptionPrimitive, IGRPFormFieldPrimitive, IGRPFormItemPrimitive, IGRPFormLabelPrimitive} from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPTextAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPSelectPrimitive, IGRPSelectContentPrimitive, IGRPSelectItemPrimitive, IGRPSelectTriggerPrimitive, IGRPSelectValuePrimitive} from '@igrp/igrp-framework-react-design-system'
import { BackButton } from '@/components/back-button';
import { useCurrentPermission, useUpdatePermission } from '../hooks/use-permission';
import { useApplications } from '@/features/applications/hooks/use-applications';

const permissionSchema = z.object({
  name: z.string().min(3, 'Permission name is required'),
  description: z.string().optional(),
  applicationId: z.number().min(1, 'Application is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

export function PermissionEditForm({ id }: { id: number }) {
  const router = useRouter();
  const { data: permission, isLoading, error } = useCurrentPermission(id);
  const { data: applications } = useApplications();
  const { mutateAsync: updatePermission, isPending: isUpdating } = useUpdatePermission();

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: '',
      description: '',
      applicationId: 0,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (permission) {
      form.reset({
        name: permission.name,
        description: permission.description || '',
        applicationId: permission.applicationId,
        status: permission.status,
      });
    }
  }, [permission, form]);

  if (isLoading) return <div>Loading permission...</div>;
  if (error) throw error;
  if (!permission) return <div>Permission not found.</div>;

  const onSubmit = async (values: PermissionFormValues) => {
    try {
      await updatePermission({
        id: permission.id,
        data: {
          name: values.name,
          description: values.description,
          applicationId: values.applicationId,
          status: values.status,
        },
      });

      toast.success('Permission updated', {
        description: 'Permission has been updated successfully.',
        duration: 2000,
      });

      setTimeout(() => {
        router.push(`/permissions/${id}`);
        router.refresh();
      }, 2000);
    } catch (error) {
      toast.error('Failed to update permission', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <BackButton />
          <h3 className='text-2xl font-bold tracking-tight'>Edit Permission</h3>
        </div>
      </div>

      <Card>
        <CardHeader className='mb-3'>
          <CardTitle>Permission Information</CardTitle>
          <CardDescription>Update the permission details below.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className='flex flex-col gap-8'>
              <div className='grid sm:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permission Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>The name of the permission.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='ACTIVE'>Active</SelectItem>
                          <SelectItem value='INACTIVE'>Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Set the permission status.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='applicationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select application' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {applications && applications.length > 0 ? (
                          applications.map((app) => (
                            <SelectItem
                              key={app.id}
                              value={app.id.toString()}
                            >
                              {app.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem
                            value='none'
                            disabled
                          >
                            No applications found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the application this permission belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Permission description'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>A brief description of the permission.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className='flex justify-end gap-2 pt-6'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                disabled={isUpdating}
                type='button'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Permission'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
