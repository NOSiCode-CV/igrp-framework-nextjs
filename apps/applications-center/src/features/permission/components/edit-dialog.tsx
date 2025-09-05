'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPButtonPrimitive,
  IGRPFormPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPInputPrimitive,
  IGRPTextAreaPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPFormMessagePrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { useUpdatePermission } from '../hooks/use-permission';
import { Permission } from '../types';
import { IGRPApplicationArgs } from '@igrp/framework-next-types';

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
  onSuccess?: () => void;
}

export function PermissionEditDialog({
  open,
  onOpenChange,
  permission,
  onSuccess,
}: PermissionEditDialogProps) {
  const { mutateAsync: updatePermission, isPending: isUpdating } = useUpdatePermission();

  const { igrpToast } = useIGRPToast();

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

      igrpToast({
        type: 'success',
        title: 'Permission updated',
        description: 'Permission has been updated successfully.',
        duration: 4000,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Failed to update permission',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        duration: 4000,
      });
    }
  };

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
    >
      <IGRPDialogContentPrimitive className='sm:max-w-[500px]'>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>Edit Permission</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Update permission information.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        {permission && (
          <IGRPFormPrimitive {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <IGRPFormFieldPrimitive
                control={form.control}
                name='name'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Permission Name</IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive {...field} />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      The name of the permission
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='description'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Description</IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPTextAreaPrimitive {...field} />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Optional description of the permission
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='applicationId'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Application</IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive>
                          <IGRPSelectValuePrimitive placeholder='IGRPSelect application' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      IGRPSelect the application this permission belongs to
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='status'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Status</IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive>
                          <IGRPSelectValuePrimitive placeholder='IGRPSelect status' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        <IGRPSelectItemPrimitive value='ACTIVE'>Active</IGRPSelectItemPrimitive>
                        <IGRPSelectItemPrimitive value='INACTIVE'>Inactive</IGRPSelectItemPrimitive>
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Set the permission status
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPDialogFooterPrimitive>
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
              </IGRPDialogFooterPrimitive>
            </form>
          </IGRPFormPrimitive>
        )}
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
