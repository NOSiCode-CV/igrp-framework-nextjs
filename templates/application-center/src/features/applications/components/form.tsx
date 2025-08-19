'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  IGRPButtonPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPFormPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import {
  useAddApplication,
  useUpdateApplication,
} from '@/features/applications/hooks/use-applications';
import { useAllUsers } from '@/features/users/hooks/use-users';
import { IGRPApplicationDTO, applicationSchema } from '@/features/applications/schemas/application';
import { Application } from '@/features/applications/types';
import { APPLICATIONS_TYPES_FILTERED } from '../lib/utils';
import { ROUTES } from '@/lib/constants';
import { handleImageUpload } from '@/lib/image-upload';

export function ApplicationForm({ application }: { application?: Application }) {
  const router = useRouter();
  const [imageError, setImageError] = useState<string | null>(null);

  const { igrpToast } = useIGRPToast();
  const { data: users, isLoading: userLoading, error: userError } = useAllUsers();
  const { mutateAsync: addApplication, isPending: isAdding } = useAddApplication();
  const { mutateAsync: updateApplication, isPending: isUpdating } = useUpdateApplication();

  const form = useForm<IGRPApplicationDTO>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'INTERNAL',
      owner: '',
      description: '',
      code: '',
      url: '',
      picture: '',
      status: 'ACTIVE',
      departmentCode: '',
    },
    mode: 'onChange',
  });

  const type = form.watch('type');

  useEffect(() => {
    if (application) {
      const defaultValues: Partial<IGRPApplicationDTO> = {
        name: application.name || '',
        owner: application.owner || '',
        code: application.code || '',
        slug: application.slug || '',
        url: application.url || '',
        description: application.description || '',
        type: application.type || 'INTERNAL',
        picture: application.picture || '',
        status: application.status || 'ACTIVE',
        departmentCode: application.departmentCode || '',
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Apenas são permitidos ficheiros de imagem.');
      e.target.value = '';
      return;
    }

    // optional: validate extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setImageError('Extensão de ficheiro inválida.');
      e.target.value = '';
      return;
    }

    setImageError(null);
    console.log('✅ Valid image:', file);
  }

  const onSubmit = async (values: IGRPApplicationDTO) => {
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

      igrpToast({
        type: 'success',
        title: application ? 'Application updated' : 'Application created',
        description: application
          ? 'Your application has been updated successfully.'
          : 'Your application has been created successfully.',
        duration: 2000,
      });

      setTimeout(() => {
        router.replace(`/apps/${payload.code}`);
      }, 2000);
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const isLoading = isAdding || isUpdating || userLoading || !users;

  if (isLoading) return <span>Carregando...</span>;
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
    <IGRPCardPrimitive className='py-6'>
      <IGRPFormPrimitive {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <IGRPCardContentPrimitive>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              <IGRPFormFieldPrimitive
                control={form.control}
                name='name'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Nome
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder='Nome da Aplicação'
                        {...field}
                        onChange={handleNameChange}
                        required
                        className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      O nome da sua aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='code'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Código
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder='APP_CODE'
                        {...field}
                        pattern='^[A-Z0-9_]+$'
                        onFocus={() => form.trigger('code')}
                        className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Apenas letras maiúsculas, números e sublinhados são permitidos.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='owner'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Proprietário
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecione o proprietário' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {userOptions.map((user) => (
                          <IGRPSelectItemPrimitive
                            key={user.value}
                            value={user.value}
                          >
                            {user.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      O Responsável pela criação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                    {userError && <p className='text-red-500'>{userError}</p>}
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='departmentCode'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Departamento
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecione o departamento' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {userOptions.map((user) => (
                          <IGRPSelectItemPrimitive
                            key={user.value}
                            value={user.value}
                          >
                            {user.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Departemento para aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                    {userError && <p className='text-red-500'>{userError}</p>}
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='type'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Tipo
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive
                          className='w-full truncate'
                          disabled={disabledFields}
                        >
                          <IGRPSelectValuePrimitive placeholder='Selecione o tipo de aplicação' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {APPLICATIONS_TYPES_FILTERED.map((opt, index) => (
                          <IGRPSelectItemPrimitive
                            key={index}
                            value={opt.value}
                          >
                            {opt.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      O tipo de aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              {type === 'INTERNAL' && (
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                        URL Relativo
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='app-exemplo'
                          {...field}
                          disabled={disabledFields}
                          className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        O identificador de URL interno.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              )}

              {type === 'EXTERNAL' && (
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='url'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                        URL
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='https://exemplo.com'
                          {...field}
                          disabled={disabledFields}
                          className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        URL da aplicação externa.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              )}

              <IGRPFormFieldPrimitive
                control={form.control}
                name='picture'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Imagem</IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder='Selecionar uma imagem para a sua aplicação'
                        onChange={(e) => handleImageUpload(e, field, form)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        type='file'
                        accept='image/*'
                        className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      A imagem da aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='description'
                render={({ field }) => (
                  <IGRPFormItemPrimitive className='sm:col-span-2'>
                    <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPTextAreaPrimitive
                        placeholder='Descreva a sua aplicação'
                        rows={2}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className='resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Uma breve descrição da sua aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            </div>
          </IGRPCardContentPrimitive>

          <IGRPCardFooterPrimitive className='flex justify-end gap-2 mt-4'>
            <IGRPButtonPrimitive
              variant='outline'
              onClick={() => router.push(ROUTES.APPS)}
              disabled={isLoading}
              type='button'
            >
              Cancelar
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
              type='submit'
              disabled={disabledBtn}
            >
              {submitLblBtn}
            </IGRPButtonPrimitive>
          </IGRPCardFooterPrimitive>
        </form>
      </IGRPFormPrimitive>
    </IGRPCardPrimitive>
  );
}
