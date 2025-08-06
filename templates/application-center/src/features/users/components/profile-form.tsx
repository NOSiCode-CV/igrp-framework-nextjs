'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPCardPrimitive, IGRPCardContentPrimitive, 
IGRPCardContentPrimitive, IGRPCardFooterPrimitive, 
IGRPCardHeaderPrimitive, IGRPCardTitlePrimitive} from '@igrp/igrp-framework-react-design-system'

import { IGRPFormPrimitive, IGRPFormControlPrimitive, IGRPFormDescriptionPrimitive, IGRPFormFieldPrimitive, IGRPFormItemPrimitive, IGRPFormLabelPrimitive} from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { BackButton } from '@/components/back-button';
import {
  useCurrentUser,
  useUpdateUser,
  // useUserImage,
  // useUserSignature
} from '@/features/users/hooks/use-users';
import { userSchema } from '@/features/users/schemas/user';
import { UserProps } from '@/features/users/types';
import { ProfileImageUpload } from '@/features/users/components/profile-image-upload';
import { ProfileSignature } from '@/features/users/components/profile-signature';

export function ProfileUserForm() {
  const router = useRouter();

  const { data: user, isLoading, error } = useCurrentUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  // const { data: getImage } = useUserImage()
  // const { data: getSignature } = useUserSignature()

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (user) {
      const defaultValues: Partial<UserProps> = {
        igrpUsername: user.igrpUsername ?? '',
        fullname: user.fullname ?? undefined,
        email: user.email ?? '',
        signature: user.signature ?? undefined,
        image: user.image ?? undefined,
        status: user.status ?? 'ACTIVE',
      };

      form.reset(defaultValues);
    }
  }, [user, form]);

  if (isLoading && !user) return <div>Loading user...</div>;
  if (error) throw error;

  async function onSubmit(values: z.infer<typeof userSchema>) {
    const formData = new FormData();
    formData.append('fullname', values.fullname || '');
    formData.append('email', values.email);

    if (values.image) {
      formData.append('picture', values.image);
    }

    if (values.signature) {
      formData.append('signature', values.signature);
    }

    await updateUser(formData);

    toast.success('User updated', {
      description: 'The user has been updated successfully.',
      duration: 2000,
    });

    router.push('/users/profile');
    router.refresh();
  }

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <BackButton />
          <h3 className='text-2xl font-bold tracking-tight'>Edit User Profile</h3>
        </div>
      </div>

      <Card>
        <CardHeader className='mb-3'>
          <CardTitle>Detailed information about this user.</CardTitle>
          <CardDescription>Manage your personal information and account settings.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className='flex flex-col gap-8'>
              <div className='grid sm:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='fullname'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='johndoe'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>The user full name.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='igrpUsername'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>The user login username.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='image'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image</FormLabel>
                      <FormControl>
                        <ProfileImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Upload a profile picture for this user.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='signature'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signature</FormLabel>
                      <FormControl>
                        <ProfileSignature
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>The user&apos;s digital signature.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className='flex justify-end gap-2 pt-6'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                disabled={isLoading}
                type='button'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>
                    <Loader className='mr-2 animate-spin' />
                    Saving...
                  </span>
                ) : user ? (
                  'Update User'
                ) : (
                  'Create User'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
