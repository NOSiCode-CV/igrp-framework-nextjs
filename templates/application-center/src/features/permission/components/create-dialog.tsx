'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPFormPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPTextAreaPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useApplications } from '@/features/applications/hooks/use-applications';
import { useAddPermission } from '../hooks/use-permission';
import { Permission } from '../types';

const permissionSchema = z.object({
  name: z.string().min(3, 'Permission name is required'),
  description: z.string().optional(),
  applicationId: z.number().min(1, 'Application is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

interface PermissionCreateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  defaultApplicationId?: number;
}

export function PermissionCreateDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  defaultApplicationId,
}: PermissionCreateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;
  const { data: applications, isLoading: isLoadingApps } = useApplications();
  const { mutateAsync: createPermission, isPending: isCreating } = useAddPermission();

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: '',
      description: '',
      applicationId: defaultApplicationId || 0,
      status: 'ACTIVE',
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
  };

  const onSubmit = async (values: PermissionFormValues) => {
    try {
      const payload: Partial<Permission> = {
        name: values.name,
        description: values.description || '',
        applicationId: values.applicationId,
        status: values.status,
      };

      await createPermission(payload);

      toast.success('Permission created', {
        description: 'Permission has been created successfully.',
      });

      form.reset();
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed to create permission', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <IGRPButtonPrimitive>Create Permission</IGRPButtonPrimitive>
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create New Permission</DialogTitle>
          <DialogDescription>
            Create a new permission and associate it with an application.
          </DialogDescription>
        </DialogHeader>

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
                    <Input
                      placeholder='Enter permission name'
                      {...field}
                      onChange={handleNameChange}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of the permission (e.g., user.create, post.edit)
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
                      placeholder='Enter permission description'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of what this permission allows
                  </FormDescription>
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
                      {isLoadingApps ? (
                        <SelectItem
                          value='loading'
                          disabled
                        >
                          Loading applications...
                        </SelectItem>
                      ) : applications && applications.length > 0 ? (
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
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Permission'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
