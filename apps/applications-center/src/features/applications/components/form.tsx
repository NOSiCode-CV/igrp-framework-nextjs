'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
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
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPApplicationArgs } from '@igrp/framework-next-types';

import { FileUploadField } from '@/components/file-upload-field';
import { AppCenterLoading } from '@/components/loading';
import { ROUTES } from '@/lib/constants';
import { urlToFileWithPreview } from '@/lib/file-adapters';
import {
  useAddApplication,
  useUpdateApplication,
} from '@/features/applications/hooks/use-applications';
import { ApplicationType, applicationSchema } from '@/features/applications/schemas/application';
import { useAllUsers } from '@/features/users/hooks/use-users';
import { APPLICATIONS_TYPES_FILTERED } from '../lib/utils';

import { useSession } from "next-auth/react"


export function ApplicationForm({ application }: { application?: IGRPApplicationArgs }) {
  const router = useRouter();
  const { data: session, status } = useSession()

  console.log({ sessionClient: session })

  const { igrpToast } = useIGRPToast();
  const { data: users, isLoading: userLoading, error: userError } = useAllUsers();
  const { mutateAsync: addApplication, } = useAddApplication();
  const { mutateAsync: updateApplication } = useUpdateApplication();

  const form = useForm<ApplicationType>({
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
      image: null,
    },
    mode: 'onChange',
  });

  const type = form.watch('type');

  useEffect(() => {
    if (!application) return;

    const defaultValues: Partial<ApplicationType> = {
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
      image: null,
    };

    form.reset(defaultValues);

    (async () => {
    if (application.picture) {
      const fw = await urlToFileWithPreview(application.picture);
      form.setValue('image', fw, { shouldDirty: false, shouldValidate: false });
    }
  })();
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

  const onSubmit = async (values: ApplicationType) => {
    const payload = { ...values };

    // const file = values.image?.file;
    // const imageFile =
    //   file instanceof File
    //     ? file
    //     : file?.file instanceof File
    //       ? file.file
    //       : undefined;


    if (payload.type === 'INTERNAL') delete payload.url;
    if (payload.type === 'EXTERNAL') delete payload.slug;

    console.log({ payload });

    try {
      if (application) {
        await updateApplication({ id: application.id, data: payload });
      } else {
        await addApplication(payload);
        form.reset();
      }

      igrpToast({
        type: 'success',
        title: `${application ? ' Atualização' : 'Criação'} concluída`,
        description: `A aplicação foi ${application ? ' atualizada' : 'criada'} com sucesso!`,
        duration: 2000,
      });

      setTimeout(() => {
        router.replace(`${ROUTES.APPS}/${payload.code}`);
      }, 2500);
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Não foi possível concluir a operação.',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
      });
    }
  };

  const isLoading = userLoading || !users;

  if (isLoading) return <AppCenterLoading descrption='A preparar dados da aplicação...' />;
  if (userError) throw userError;

  const userOptions = users.map((user) => {
    return {
      value: user.username,
      label: user.name,
    };
  });

  const disabledFields = application ? true : false;
  const disabledBtn = form.formState.isSubmitting || isLoading || userLoading || userError !== null;
  const submitLblBtn = form.formState.isSubmitting ? 'A guardar...' : 'Guardar';  

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
                      Permite letras maiúsculas, números e sublinhados.
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

                    {userError ? (
                      <p className='text-destructive'>{userError}</p>
                    ) : (
                      <>
                        <IGRPFormDescriptionPrimitive>
                          O Responsável pela criação.
                        </IGRPFormDescriptionPrimitive>
                        <IGRPFormMessagePrimitive />
                      </>
                    )}
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
                    {userError ? (
                      <p className='text-destructive'>{userError}</p>
                    ) : (
                      <>
                        <IGRPFormDescriptionPrimitive>
                          Departemento para aplicação.
                        </IGRPFormDescriptionPrimitive>
                        <IGRPFormMessagePrimitive />
                      </>
                    )}
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
                      <IGRPFormDescriptionPrimitive>O URL interno.</IGRPFormDescriptionPrimitive>
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
                name="image"
                render={({ field }) => (
                  <FileUploadField                               
                    value={field.value ?? null}        
                    onChange={field.onChange}
                    maxSizeMB={1}                    
                    disabled={form.formState.isSubmitting}
                    btnLabel='Selecionar Logo'
                    placeholder='Arraste seu logo aqui'
                  />
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
            <IGRPButton
              variant='outline'
              onClick={() => router.push(ROUTES.APPS)}              
              type='button'
              showIcon
              iconPlacement='start'              
              iconName='Undo2'    
              className='gap-1'       
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              type='submit'
              disabled={disabledBtn}
              showIcon
              iconPlacement='end'
              loading={isLoading}
              iconName='Save'
              className='gap-1'      
            >
              {submitLblBtn}
            </IGRPButton>
          </IGRPCardFooterPrimitive>
        </form>
      </IGRPFormPrimitive>
    </IGRPCardPrimitive>
  );
}
