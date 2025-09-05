import {
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogTriggerPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormPrimitive,
  IGRPInputPrimitive,
  IGRPRadioGroupItemPrimitive,
  IGRPRadioGroupPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';
import { CreateRoleArgs, normalizeRole, RoleArgs, roleSchema } from '../role-schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { statusSchema } from '@/schemas/global';
import { useEffect, useState } from 'react';
import { OPEN_TYPE_VIEW, STATUS_OPTIONS } from '@/lib/constants';
import { useCreateMenu, useUpdateMenu } from '@/features/menus/use-menus';
import { useCreateRole, useUpdateRole } from '../use-roles';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentCode: string;
  role?: RoleArgs;
  openType?: 'edit' | 'view';
  roles?: RoleArgs[];
}

export function RoleFormDialog({
  open,
  onOpenChange,
  departmentCode,
  role,
  openType,
  roles
}: RoleFormDialogProps) {

  const [isLoading, setIsLoading] = useState(false);

  const { igrpToast } = useIGRPToast();

  const { mutateAsync: createRole, isPending: isAddingRole } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateRole();

  const form = useForm<RoleArgs>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      departmentCode: departmentCode,
      parentName: '',
      status: statusSchema.enum.ACTIVE,
    },
  }); ~

    useEffect(() => {
      if (!open) return;

      if (role) {
        form.reset({
          name: role.name ?? '',
          description: role.description ?? '',
          departmentCode: departmentCode ?? '',
          parentName: role.parentName ?? '',
          status: role.status ?? statusSchema.enum.ACTIVE,

        } as RoleArgs);
      }
    }, [open, role, departmentCode, form]);


  const onSubmit = async (values: RoleArgs) => {

    console.log({ values })
    
    try {
      const payload = normalizeRole(values as CreateRoleArgs);

      await createRole(payload)
      igrpToast({
        type: 'success',
        title: 'Adicionar Perfil',
        description: 'Perfil foi adicionado com sucesso.',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Falha ao adicionar perfil:', error);
      igrpToast({
        type: 'error',
        title: 'Falha ao adicionar perfil',
        description: `Tente novamente. ${error}`,
      });
    }
  };

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      modal
    >
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>Adicionar Perfil</IGRPDialogTitlePrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
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
                      placeholder='Identificador único do perfil'
                      required
                      className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      {...field}
                    />
                  </IGRPFormControlPrimitive>
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
                      placeholder=' Breve descrição do perfil'
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

            {roles && roles.length > 0 && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name='parentName'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Perfil Pai
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecione o perfil pai' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {roles.map((role) => (
                          <IGRPSelectItemPrimitive
                            key={role.name}
                            value={role.name}
                          >
                            {role.description ?? role.name}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            )}

            {role && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name='status'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Estado</IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={openType === OPEN_TYPE_VIEW}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecionar estado' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {STATUS_OPTIONS.map((status) => (
                          <IGRPSelectItemPrimitive
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            )}

            <IGRPDialogFooterPrimitive className='pt-4'>
              <IGRPButtonPrimitive
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                type='submit'
                disabled={isAddingRole}
              >
                {isAddingRole ? 'Guardando...' : 'Adicionar'}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
