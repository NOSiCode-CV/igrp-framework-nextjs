'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { IGRPDialogPrimitive,  IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogFooterPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormPrimitive, IGRPFormControlPrimitive, IGRPFormDescriptionPrimitive, IGRPFormFieldPrimitive, IGRPFormItemPrimitive, IGRPFormLabelPrimitive} from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPTextAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPSelectPrimitive, IGRPSelectContentPrimitive, IGRPSelectItemPrimitive, IGRPSelectTriggerPrimitive, IGRPSelectValuePrimitive} from '@igrp/igrp-framework-react-design-system'
import { useUpdatePermission } from '../hooks/use-permission';
import { Permission } from '../types';
import { Application } from '@/features/applications/types';

const permissionSchema = z.object({
  name: z.string().min(3, 'Permission name is required'),
  description: z.string().optional(),
  applicationId: z.number().min(1, 'Application is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

interface PermissionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: Permission | null;
  applications: Application[];
  onSuccess?: () => void;
}

export function PermissionEditDialog({
  open,
  onOpenChange,
  permission,
  applications,
  onSuccess,
}: PermissionEditDialogProps) {
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

  const onSubmit = async (values: PermissionFormValues) => {
    if (!permission) return;

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
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update permission', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit Permission</DialogTitle>
          <DialogDescription>Update permission information.</DialogDescription>
        </DialogHeader>

        {permission && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permission Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>The name of the permission</FormDescription>
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>Optional description of the permission</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      Select the application this permission belongs to
                    </FormDescription>
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
                    <FormDescription>Set the permission status</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <IGRPButtonPrimitive
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive
                  type='submit'
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Permission'}
                </IGRPButtonPrimitive>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
