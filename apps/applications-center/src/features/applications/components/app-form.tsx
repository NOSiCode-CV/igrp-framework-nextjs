'use client';

import { useEffect, useMemo, useState } from 'react';
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
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
  IGRPButton,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPCommandPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandItemPrimitive,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPApplicationArgs } from '@igrp/framework-next-types';

import { FileUploadField } from '@/components/file-upload-field';
import { AppCenterLoading } from '@/components/loading';
import { ROUTES } from '@/lib/constants';
import { urlToFileWithPreview } from '@/lib/file-adapters';
import {
  useCreateApplication,
  useUpdateApplication,
} from '@/features/applications/use-applications';
import {
  ApplicationArgs,
  appTypeCrud,
  applicationSchema,
} from '@/features/applications/app-schemas';
import { useUsers } from '@/features/users/use-users';
import { useDepartments } from '@/features/departments/use-departments';
import { APPLICATIONS_TYPES_FILTERED } from '../app-utils';
import { statusSchema } from '@/schemas/global';

export function ApplicationForm({ application }: { application?: IGRPApplicationArgs }) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();

  const { data: users, isLoading: userLoading, error: userError } = useUsers();
  const {
    data: departments,
    isLoading: departmentLoading,
    error: departmentError,
  } = useDepartments();

  const { mutateAsync: addApplication } = useCreateApplication();
  const { mutateAsync: updateApplication } = useUpdateApplication();
  

  const form = useForm<ApplicationArgs>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: appTypeCrud.enum.INTERNAL,
      owner: '',
      description: '',
      code: '',
      url: '',
      picture: '',
      status: statusSchema.enum.ACTIVE,
      departments: [],
      image: null,
    },
    mode: 'onChange',
  });

  const type = form.watch('type');

  useEffect(() => {
    if (!application) return;

    const defaultValues: Partial<ApplicationArgs> = {
      name: application.name || '',
      owner: application.owner || '',
      code: application.code || '',
      slug: application.slug || '',
      url: application.url || '',
      description: application.description || '',
      type: application.type || appTypeCrud.enum.INTERNAL,
      picture: application.picture || '',
      status: application.status || statusSchema.enum.ACTIVE,
      departments: application.departments || [],
      image: null,
    };

    form.reset(defaultValues);

  //     const { data: file } = useFiles('public/igrptest/superadmin/5bc7168c-e664-44c4-9672-964e186b6486_transferir.svg');

  //   const getFile = () => {
  //   const result = file
  //   console.log({ result })
  //   return result?.url || '/igrp/placeholder-carousel.png'
  // }

    (async () => {
      if (application.picture) {
        const fw = await urlToFileWithPreview(application.picture);
        form.setValue('image', fw, { shouldDirty: false, shouldValidate: false });
      }
    })();
  }, [application, form]);

  // add near the top (anywhere in the file)
  const toggleInArray = (arr: string[] | undefined, value: string) => {
    const set = new Set(arr ?? []);
    set.has(value) ? set.delete(value) : set.add(value);
    return Array.from(set);
  };
  const removeFromArray = (arr: string[] | undefined, value: string) =>
    (arr ?? []).filter(v => v !== value);


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

  const onSubmit = async (values: ApplicationArgs) => {
    const payload = { ...values };

    const file = values.image?.file;
    console.log({ file })
    // const imageFile =
    //   file instanceof File
    //     ? file
    //     : file?.file instanceof File
    //       ? file.file
    //       : undefined;

    if (payload.type === appTypeCrud.enum.INTERNAL) delete payload.url;
    if (payload.type === appTypeCrud.enum.EXTERNAL) delete payload.slug;
    delete payload.image;

    try {
      // if (application) {
      //   const payloadData = mapperUpdateApplication(payload);
      //   await updateApplication({ code: application.code, data: payloadData });
      // } else {
      //   await addApplication(payload);
      //   form.reset();
      // }

      igrpToast({
        type: 'success',
        title: `${application ? ' Atualização' : 'Criação'} concluída`,
        description: `A aplicação foi ${application ? ' atualizada' : 'criada'} com sucesso!`,
        duration: 3500,
      });      
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Não foi possível concluir a operação.',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
      });
    } finally {
      // setTimeout(() => {
      //   router.push(`${ROUTES.APPLICATIONS}/${payload.code}`);
      // }, 5000);
    }
  };

  const isLoading = userLoading || !users || !departments || departmentLoading;

  if (isLoading) return <AppCenterLoading descrption='A preparar dados da aplicação...' />;
  if (userError) throw userError;
  if (departmentError) throw departmentError;

  const userOptions = users.map((user) => {
    return {
      value: user.username,
      label: user.name,
    };
  });

  const departmentOptions = departments.map((department) => {
    return {
      value: department.code,
      label: department.name,
    };
  });

  const disabledFields = application ? true : false;

  const disabledBtn =
    form.formState.isSubmitting ||
    isLoading ||
    userLoading ||
    userError !== null ||
    departmentLoading ||
    departmentError !== null;

  const submitLblBtn = form.formState.isSubmitting ? 'Guardando...' : 'Guardar';

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
                      <IGRPFormMessagePrimitive />
                    )}
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name="departments"
                render={({ field }) => {
                  const [open, setOpen] = useState(false);

                  // Current selection set for O(1) lookups
                  const selected = useMemo(() => new Set(field.value ?? []), [field.value]);

                  // Pretty label for any department code
                  const getLabel = (code: string) =>
                    departmentOptions.find(o => o.value === code)?.label ?? code;

                  const count = field.value?.length ?? 0;

                  return (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                        Departamentos
                      </IGRPFormLabelPrimitive>

                      {/* Selected badges */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {count > 0 ? (
                          field.value!.map(code => (
                            <IGRPBadgePrimitive key={code} variant="outline" className="gap-1">
                              {getLabel(code)}
                              <button
                                type="button"
                                aria-label="Remover departamento"
                                className="ml-1 inline-flex items-center"
                                onClick={() => field.onChange(removeFromArray(field.value, code))}
                                disabled={disabledFields}
                              >
                                <IGRPIcon iconName="X" className="h-3 w-3" />
                              </button>
                            </IGRPBadgePrimitive>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Nenhum selecionado</span>
                        )}
                      </div>

                      {/* Popover trigger */}
                      <IGRPPopoverPrimitive open={open} onOpenChange={setOpen}>
                        <IGRPPopoverTriggerPrimitive asChild>
                          <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            disabled={disabledFields}
                            className="w-full justify-between"
                          >
                            <span>
                              {count > 0
                                ? `Selecionados (${count})`
                                : "Selecionar departamentos"}
                            </span>
                            <IGRPIcon iconName={open ? "ChevronUp" : "ChevronDown"} />
                          </IGRPButtonPrimitive>
                        </IGRPPopoverTriggerPrimitive>

                        {/* Command + searchable list */}
                        <IGRPPopoverContentPrimitive className="p-0 w-[--radix-popover-trigger-width] min-w-64" align="start">
                          <IGRPCommandPrimitive>
                            <IGRPCommandInputPrimitive placeholder="Procurar departamento..." />
                            <IGRPCommandListPrimitive className="max-h-64">
                              <IGRPCommandGroupPrimitive heading="Departamentos">
                                {departmentOptions.map(opt => {
                                  const isSelected = selected.has(opt.value);
                                  return (
                                    <IGRPCommandItemPrimitive
                                      key={opt.value}
                                      // @note: CommandItem gives us onSelect(label)
                                      // we rely on the option.value via closure
                                      onSelect={() => {
                                        const next = toggleInArray(field.value, opt.value);
                                        field.onChange(next);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      {/* Checkmark indicator */}
                                      <IGRPIcon
                                        iconName={isSelected ? "Check" : "Circle"}
                                        className="h-4 w-4 opacity-70"
                                      />
                                      <span className="truncate">{opt.label}</span>
                                    </IGRPCommandItemPrimitive>
                                  );
                                })}
                              </IGRPCommandGroupPrimitive>
                            </IGRPCommandListPrimitive>

                            {/* Footer actions (optional) */}
                            <div className="flex items-center justify-between p-2 border-t">
                              <IGRPButtonPrimitive
                                type="button"
                                variant="ghost"
                                className="text-xs"
                                onClick={() => field.onChange([])}
                                disabled={disabledFields || count === 0}
                              >
                                Limpar seleção
                              </IGRPButtonPrimitive>
                              <IGRPButtonPrimitive
                                type="button"
                                size="sm"
                                onClick={() => setOpen(false)}
                              >
                                Concluir
                              </IGRPButtonPrimitive>
                            </div>
                          </IGRPCommandPrimitive>
                        </IGRPPopoverContentPrimitive>
                      </IGRPPopoverPrimitive>

                      {departmentError ? (
                        <p className="text-destructive">{String(departmentError)}</p>
                      ) : (
                        <IGRPFormMessagePrimitive />
                      )}
                    </IGRPFormItemPrimitive>
                  );
                }}
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
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              )}

             <IGRPFormFieldPrimitive
                control={form.control}
                name='image'
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
                  <IGRPFormItemPrimitive className='lg:col-span-2'>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Descrição
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPTextAreaPrimitive
                        placeholder='Descreva a sua aplicação'
                        required={true}
                        rows={2}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className='resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            </div>
          </IGRPCardContentPrimitive>

          <IGRPCardFooterPrimitive className='justify-end pt-6 gap-3 flex-col sm:flex-row'>
            <IGRPButton
              variant='outline'
              onClick={() => router.push(ROUTES.APPLICATIONS)}
              type='button'
              disabled={disabledBtn}
              showIcon
              iconPlacement='start'
              iconName='Undo2'
              className='gap-1 w-full sm:max-w-36'
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              type='submit'
              disabled={disabledBtn}
              showIcon
              iconPlacement='end'
              loading={isLoading}
              iconName='Check'
              className='gap-1 w-full sm:max-w-36'
            >
              {submitLblBtn}
            </IGRPButton>
          </IGRPCardFooterPrimitive>
        </form>
      </IGRPFormPrimitive>
    </IGRPCardPrimitive>
  );
}
