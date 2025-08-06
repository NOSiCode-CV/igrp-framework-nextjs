'use client';

import { useState } from 'react';
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
import { useApplications } from '@/features/applications/hooks/use-applications';
import { useAddDepartment } from '../hooks/use-departments';

const departmentSchema = z.object({
  name: z.string().min(3, 'Department name is required'),
  code: z.string().min(2, 'Department code is required'),
  description: z.string().optional(),
  application_id: z.number().min(1, 'Application is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  parent_id: z.number().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentCreateDialogProps {
  onSuccess?: () => void;
}

export function DepartmentCreateDialog({ onSuccess }: DepartmentCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: applications, isLoading: isLoadingApps } = useApplications();
  const { mutateAsync: createDepartment, isPending: isCreating } = useAddDepartment();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      application_id: 0,
      status: 'ACTIVE',
      parent_id: undefined,
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);

    if (form.getValues('code') === '') {
      const code = `DEPT_${name.replace(/\s+/g, '_').toUpperCase()}`.substring(0, 30);
      form.setValue('code', code);
    }
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      await createDepartment(values);

      toast.success('Department created', {
        description: 'Department has been created successfully.',
      });

      form.reset();
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed to create department', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>Create Department</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>
            Create a new department and associate it with an application.
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
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter department name'
                      {...field}
                      onChange={handleNameChange}
                    />
                  </FormControl>
                  <FormDescription>The name of the department</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='DEPT_CODE'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>A unique code for the department</FormDescription>
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
                      placeholder='Enter department description'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional description of the department</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='application_id'
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
                    Select the application this department belongs to
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
                  <FormDescription>Set the department status</FormDescription>
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
                {isCreating ? 'Creating...' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
