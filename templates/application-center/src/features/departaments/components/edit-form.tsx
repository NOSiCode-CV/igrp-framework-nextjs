'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';

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
import { BackButton } from '@/components/back-button';
import { useCurrentDepartment, useUpdateDepartment } from '../hooks/use-departments';

const departmentSchema = z.object({
  name: z.string().min(3, 'Department name is required'),
  code: z.string().min(2, 'Department code is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  application_id: z.number().min(1, 'Application is required'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function DepartmentEditForm({ id }: { id: number }) {
  const router = useRouter();
  const { data: department, isLoading, error } = useCurrentDepartment(id);
  const { mutateAsync: updateDepartment, isPending: isUpdating } = useUpdateDepartment();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
      application_id: 0,
    },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        code: department.code,
        description: department.description || '',
        status: department.status,
        application_id: department.application_id,
      });
    }
  }, [department, form]);

  if (isLoading) return <div>Loading department...</div>;
  if (error) throw error;
  if (!department) return <div>Department not found.</div>;

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      await updateDepartment({
        id: department.id,
        data: {
          name: values.name,
          description: values.description,
          status: values.status,
          application_id: values.application_id,
          code: department.code,
        },
      });

      toast.success('Department updated', {
        description: 'Department has been updated successfully.',
        duration: 2000,
      });

      setTimeout(() => {
        router.push(`/department/${id}`);
        router.refresh();
      }, 2000);
    } catch (error) {
      toast.error('Failed to update department', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <BackButton />
          <h3 className='text-2xl font-bold tracking-tight'>Edit Department</h3>
        </div>
      </div>

      <Card>
        <CardHeader className='mb-3'>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>Update the department details below.</CardDescription>
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
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>The name of the department.</FormDescription>
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
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>Department code cannot be changed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='application_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application ID</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value?.toString() || ''}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>Application cannot be changed.</FormDescription>
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
                      <FormDescription>Set the department status.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Department description'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>A brief description of the department.</FormDescription>
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
                {isUpdating ? 'Updating...' : 'Update Department'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
