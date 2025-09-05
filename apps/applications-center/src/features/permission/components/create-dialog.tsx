'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  IGRPDialogTriggerPrimitive,
  IGRPFormMessagePrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { useApplications } from '@/features/applications/use-applications';
import { useAddPermission } from '@/features/permission/hooks/use-permission';
import {
  CreatePermissionType,
  PermissionFormValues,
  permissionFormSchema,
  permissionStatusSchema,
} from '@/features/permission/permissions-schemas';

interface PermissionCreateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  defaultAppCode?: string;
}

export function PermissionCreateDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  defaultAppCode,
}: PermissionCreateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const { data: applications, isLoading: isLoadingApps } = useApplications();
  const { mutateAsync: createPermission, isPending: isCreating } = useAddPermission();

  const { igrpToast } = useIGRPToast();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      applicationCode: defaultAppCode,
      status: permissionStatusSchema.enum.ACTIVE,
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
  };

  const onSubmit = async (values: PermissionFormValues) => {
    try {
      const payload: CreatePermissionType = {
        name: values.name,
        description: values.description || '',
        applicationCode: values.applicationCode,
      };

      await createPermission(payload);

      igrpToast({
        type: 'success',
        title: 'Permissão Criada',
        description: 'Permissão criada com sucesso.',
        duration: 4000,
      });

      form.reset();
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Não foi possível criar a permissão.',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
        duration: 4000,
      });
    }
  };

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={setOpen}
    >
      {!isControlled && (
        <IGRPDialogTriggerPrimitive asChild>
          <IGRPButtonPrimitive>Criar Permissões</IGRPButtonPrimitive>
        </IGRPDialogTriggerPrimitive>
      )}
      <IGRPDialogContentPrimitive className=''>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>Criar Nova Permissão</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Create a new permission and associate it with an application.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

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
                  <IGRPFormLabelPrimitive>Nome</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      placeholder='Enter permission name'
                      {...field}
                      onChange={handleNameChange}
                    />
                  </IGRPFormControlPrimitive>
                  {/* <IGRPFormDescriptionPrimitive>
                    The name of the permission (e.g., user.create, post.edit)
                  </IGRPFormDescriptionPrimitive> */}
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name='description'
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder='Enter permission description'
                      {...field}
                    />
                  </IGRPFormControlPrimitive>
                  {/* <IGRPFormDescriptionPrimitive>
                    Optional description of what this permission allows
                  </IGRPFormDescriptionPrimitive> */}
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name='applicationCode'
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Applicação</IGRPFormLabelPrimitive>
                  <IGRPSelectPrimitive
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <IGRPFormControlPrimitive>
                      <IGRPSelectTriggerPrimitive>
                        <IGRPSelectValuePrimitive placeholder='Select application' />
                      </IGRPSelectTriggerPrimitive>
                    </IGRPFormControlPrimitive>
                    <IGRPSelectContentPrimitive>
                      {isLoadingApps ? (
                        <IGRPSelectItemPrimitive
                          value='loading'
                          disabled
                        >
                          Carregando Aplicações...
                        </IGRPSelectItemPrimitive>
                      ) : applications && applications.length > 0 ? (
                        applications.map((app) => (
                          <IGRPSelectItemPrimitive
                            key={app.id}
                            value={app.id.toString()}
                          >
                            {app.name}
                          </IGRPSelectItemPrimitive>
                        ))
                      ) : (
                        <IGRPSelectItemPrimitive
                          value='none'
                          disabled
                        >
                          Aplcações não encontradas
                        </IGRPSelectItemPrimitive>
                      )}
                    </IGRPSelectContentPrimitive>
                  </IGRPSelectPrimitive>
                  <IGRPFormDescriptionPrimitive>
                    Seleionar a aplicação para essa permissão
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
                  <IGRPFormLabelPrimitive>Estado</IGRPFormLabelPrimitive>
                  <IGRPSelectPrimitive
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <IGRPFormControlPrimitive>
                      <IGRPSelectTriggerPrimitive>
                        <IGRPSelectValuePrimitive placeholder='Select status' />
                      </IGRPSelectTriggerPrimitive>
                    </IGRPFormControlPrimitive>
                    <IGRPSelectContentPrimitive>
                      <IGRPSelectItemPrimitive value='ACTIVE'>Ativo</IGRPSelectItemPrimitive>
                      <IGRPSelectItemPrimitive value='INACTIVE'>Inativo</IGRPSelectItemPrimitive>
                    </IGRPSelectContentPrimitive>
                  </IGRPSelectPrimitive>
                  <IGRPFormDescriptionPrimitive>
                    Definir o estado da permissão.
                  </IGRPFormDescriptionPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPDialogFooterPrimitive>
              <IGRPButtonPrimitive
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancelar
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                type='submit'
                disabled={isCreating}
              >
                {isCreating ? 'Criando...' : 'Criar Permissões'}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
