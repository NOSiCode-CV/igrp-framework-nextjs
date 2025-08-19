'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/components/file-upload-field';
import { profileFormSchema, type ProfileFormData } from '@/lib/schemas';

export function ProfileForm() {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      avatar: [],
      documents: [],
    },
  });

  async function onSubmit(data: ProfileFormData) {
    console.log('Form data:', data);

    // Handle file uploads here
    if (data.avatar.length > 0) {
      const avatarFile = data.avatar[0].file;
      console.log('Avatar file:', avatarFile);

      // Example: Upload to server
      // const formData = new FormData()
      // formData.append('avatar', avatarFile)
      // await fetch('/api/upload', { method: 'POST', body: formData })
    }

    if (data.documents && data.documents.length > 0) {
      console.log(
        'Document files:',
        data.documents.map((d) => d.file),
      );
    }

    // Show success message or redirect
    alert('Profile updated successfully!');
  }

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Update Profile</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter your name'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Enter your email'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='avatar'
            render={({ field }) => (
              <FileUploadField
                label='Profile Avatar'
                description='Upload a profile picture (max 2MB)'
                value={field.value}
                onChange={field.onChange}
                maxSizeMB={2}
                accept='image/svg+xml,image/png,image/jpeg,image/jpg,image/gif'
                multiple={false}
                placeholder='Drop your profile image here'
              />
            )}
          />

          <FormField
            control={form.control}
            name='documents'
            render={({ field }) => (
              <FileUploadField
                label='Documents (Optional)'
                description='Upload additional documents if needed'
                value={field.value || []}
                onChange={field.onChange}
                maxSizeMB={5}
                accept='image/*,application/pdf,.doc,.docx'
                multiple={true}
                placeholder='Drop your documents here'
              />
            )}
          />

          <Button
            type='submit'
            className='w-full'
          >
            Update Profile
          </Button>
        </form>
      </Form>
    </div>
  );
}
