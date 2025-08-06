'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPCardPrimitive, IGRPCardContentPrimitive, IGRPCardFooterPrimitive, IGRPSelectTriggerPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPFormPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormDescriptionPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPSelectPrimitive, IGRPSelectContentPrimitive, IGRPSelectItemPrimitive, IGRPSelectValuePrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPTextAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  useAddApplication,
  useUpdateApplication,
} from '@/features/applications/hooks/use-applications';
import { APPLICATIONS_TYPES } from '@/lib/constants';
import { useAllUsers } from '@/features/users/hooks/use-users';
import { ApplicationProps, applicationSchema } from '@/features/applications/schemas/application';
import { Application } from '@/features/applications/types';

export function ApplicationForm({ application }: { application?: Application }) {
  const router = useRouter();
  const { data: users, isLoading: userLoading, error: userError } = useAllUsers();
  const { mutateAsync: addApplication, isPending: isAdding } = useAddApplication();
  const { mutateAsync: updateApplication, isPending: isUpdating } = useUpdateApplication();

  const form = useForm<ApplicationProps>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'INTERNAL',
      owner: '',
      description: '',
      code: '',
      url: '',
      userPermissions: ['whole-api'],
      picture: '',
      status: 'ACTIVE',
    },
    mode: 'onChange',
  });

  const type = form.watch('type');

  useEffect(() => {
    if (application) {
      const defaultValues: Partial<ApplicationProps> = {
        name: application.name || '',
        owner: application.owner || '',
        code: application.code || '',
        slug: application.slug || '',
        url: application.url || '',
        description: application.description || '',
        type: application.type || 'INTERNAL',
        picture: application.picture || 'AppWindow',
        status: application.status || 'ACTIVE',
      };

      form.reset(defaultValues);
    }
  }, [application, form]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);

    if (!application || form.getValues('slug') === '') {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      form.setValue('slug', slug);
    }
  };

  const onSubmit = async (values: ApplicationProps) => {
    const payload = { ...values };
    if (payload.type === 'INTERNAL') delete payload.url;
    if (payload.type === 'EXTERNAL') delete payload.slug;

    try {
      if (application) {
        await updateApplication({ id: application.id, data: payload });
      } else {
        await addApplication(payload);
        form.reset();
      }

      toast.success(application ? 'Application updated' : 'Application created', {
        description: application
          ? 'Your application has been updated successfully.'
          : 'Your application has been created successfully.',
        duration: 2000,
      });

      setTimeout(() => {
        router.replace(`/applications/${payload.code}`);
      }, 2000);
    } catch (error) {
      toast.error('Something went wrong', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const isLoading = isAdding || isUpdating || userLoading || !users;

  if (isLoading) return <span>Loading...</span>;
  if (userError) throw userError;

  const userOptions = users.map((user) => {
    return {
      value: user.username,
      label: user.name,
    };
  });

  const disabledFields = application ? true : false;
  const disabledBtn = form.formState.isSubmitting || isLoading || userLoading || userError !== null;
  const submitLblBtn = form.formState.isSubmitting
    ? 'Saving...'
    : application
      ? 'Update Application'
      : 'Create Application';

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className='pt-3 pb-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Application name'
                        {...field}
                        onChange={handleNameChange}
                        required
                      />
                    </FormControl>
                    <FormDescription>The display name of your application.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='APP_CODE'
                        {...field}
                        pattern='^[A-Z0-9_]+$'
                        onFocus={() => form.trigger('code')}
                      />
                    </FormControl>
                    <FormDescription>
                      Only uppercase letters, numbers, and underscores are allowed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='owner'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select application owner' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userOptions.map((user) => (
                          <SelectItem
                            key={user.value}
                            value={user.value}
                          >
                            {user.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the responsible user.</FormDescription>
                    <FormMessage />
                    {userError && <p className='text-red-500'>{userError}</p>}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className='w-full'
                          disabled={disabledFields}
                        >
                          <SelectValue placeholder='Select application type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPLICATIONS_TYPES.map((opt, index) => (
                          <SelectItem
                            key={index}
                            value={opt.value}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The type of application.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === 'INTERNAL' && (
                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='application-slug'
                          {...field}
                          disabled={disabledFields}
                        />
                      </FormControl>
                      <FormDescription>The internal URL identifier.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {type === 'EXTERNAL' && (
                <FormField
                  control={form.control}
                  name='url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://example.com'
                          {...field}
                          disabled={disabledFields}
                        />
                      </FormControl>
                      <FormDescription>The external application URL.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem className='col-span-3'>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe your application'
                        className='resize-none'
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>A brief description of your application.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* // TODO: add update picture for application */}
              {/* <FormField
                control={form.control}
                name='picture'
                render={({ field }) => (
                  <FormItem className='col-span-3'>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe your application'
                        className='resize-none'
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>A brief description of your application.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>
          </CardContent>

          <CardFooter className='flex justify-end gap-2 px-6'>
            <Button
              variant='outline'
              onClick={() => router.push('/applications')}
              disabled={isLoading}
              type='button'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={disabledBtn}
            >
              {submitLblBtn}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
