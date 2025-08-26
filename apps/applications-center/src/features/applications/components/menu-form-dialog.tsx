'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  IGRPButtonPrimitive,
  IGRPCommandPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPFormPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPInputPrimitive,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPRadioGroupPrimitive,
  IGRPRadioGroupItemPrimitive,
  IGRPScrollAreaPrimitive,
  useIGRPToast,
  IGRPFormMessagePrimitive,
  IGRPIcon,
  IGRPIconName,
  LucideProps,
  IGRPIconList
} from '@igrp/igrp-framework-react-design-system';
import z from 'zod';

import { cn } from '@/lib/utils';
import { useResourcesByApplication } from '@/features/resources/hooks/use-resources';
import { createMenuSchema } from '../schemas/menu';
import { IGRPMenuItemArgs } from '@igrp/framework-next-types';


type IconOption = {
  value: IGRPIconName;
  label: string;
};

export const LUCIDE_ICON_OPTIONS: IconOption[] =
  (Object.keys(IGRPIconList) as IGRPIconName[])
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      value: name,
      label: name,
    }));


interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: IGRPMenuItemArgs;
  onSave?: (values: z.infer<typeof createMenuSchema>, id?: number) => void;
  parentMenus: IGRPMenuItemArgs[];
  appCode: string;
}

export function MenuFormDialog({
  open,
  onOpenChange,
  menu,
  onSave,
  parentMenus,
  appCode,
}: MenuFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { igrpToast } = useIGRPToast();

  const { data: resources = [], isLoading: resourcesLoading } =
    useResourcesByApplication(appCode);

  const form = useForm<IGRPMenuItemArgs>({
    defaultValues: {
      name: '',
      type: 'FOLDER',
      position: 0,
      icon: 'app-window',
      status: 'ACTIVE',
      target: 'INTERNAL',
      url: '',
      parentCode: '',
      applicationCode: appCode,
    },
  });

  useEffect(() => {
    if (open) {
      if (menu) {
        form.reset({
          name: menu.name,
          type: menu.type,
          position: menu.position || 0,
          icon: menu.icon || 'app-window',
          status: menu.status || 'ACTIVE',
          target: menu.target || 'INTERNAL',
          url: menu.url || '',
          parentCode: menu.parentCode || '',
          applicationCode: menu.applicationCode,
        });
      } else {
        form.reset({
          name: '',
          type: 'MENU_PAGE',
          position: 0,
          icon: 'AppWindow',
          status: 'ACTIVE',
          target: 'INTERNAL',
          url: '',
          parentCode: '',
          applicationCode: appCode,
        });
      }
    }
  }, [menu, form, open, appCode]);

  function onSubmit(values: IGRPMenuItemArgs) {
    if (!values.name.trim()) {
      form.setError('name', { message: 'Name is required' });
      return;
    }

    if (values.type === 'EXTERNAL_PAGE' && values.url && !values.url.trim()) {
      form.setError('url', { message: 'URL is required for external page menus' });
      return;
    }

    if (!values.applicationCode) {
      form.setError('applicationCode', { message: 'Application ID is required' });
      return;
    }

    const payload: Partial<IGRPMenuItemArgs> = {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      target: values.target,
      parentCode: values.parentCode,
      applicationCode: values.applicationCode,
    };

    if (values.type === 'EXTERNAL_PAGE') {
      payload.url = values.url;
    }

    setIsLoading(true);
    try {
      // onSave(payload as z.infer<typeof createMenuSchema>, menu?.id);
      onOpenChange(false);
    } catch (err) {
      igrpToast({
        type: 'error',
        title: 'Something went wrong. Please try again.',
        description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isMenuPage = form.watch('type') === 'MENU_PAGE';
  const isExternalPage = form.watch('type') === 'EXTERNAL_PAGE';
  const selectedIcon = form.watch('icon');

  const currentIcon = LUCIDE_ICON_OPTIONS.find((icon) => icon.value === selectedIcon);

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      modal
    >
      <IGRPDialogContentPrimitive className='py-4 px-0'>
        <IGRPDialogHeaderPrimitive className='px-4'>
          <IGRPDialogTitlePrimitive>
            {menu ? 'Editar Menu' : 'Criar Menu'}
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            {menu
              ? 'Atualizar os detalhes deste item de menu.'
              : 'Adicionar um novo item de menu à aplicação.'}
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPScrollAreaPrimitive className='max-h-[80vh] px-4'>
          <IGRPFormPrimitive {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex flex-col gap-5 p-2'
            >
              <div className='grid grid-cols-1'>
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive 
                        className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
                      >
                        Nome
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='Nome de Menu'
                          {...field}
                        />
                      </IGRPFormControlPrimitive>
                      {/* <IGRPFormDescriptionPrimitive>O nome de apresentação do menu.</IGRPFormDescriptionPrimitive> */}
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              </div>

               <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive 
                        className='after:content-["*"] after:text-destructive gap-0.5 mb-1' 
                      >
                        Tipo
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPRadioGroupPrimitive
                          orientation='vertical'
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset fields when changing type
                            if (value === 'FOLDER') {
                              // form.setValue('resourceId', null);
                              form.setValue('url', '');
                            } else if (value === 'MENU_PAGE') {
                              form.setValue('url', '');
                            } else if (value === 'EXTERNAL_PAGE') {
                              // form.setValue('resourceId', null);
                            }
                          }}
                          value={field.value}                                          
                        >
                          <IGRPFormItemPrimitive className='flex'>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupItemPrimitive
                                value='MENU_PAGE'
                                className='cursor-pointer border-primary'
                              />
                            </IGRPFormControlPrimitive>
                            <IGRPFormLabelPrimitive className='font-normal'>
                              Menu de Página
                            </IGRPFormLabelPrimitive>
                          </IGRPFormItemPrimitive>
                          <IGRPFormItemPrimitive className='flex'>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupItemPrimitive
                                value='GROUP'
                                className='cursor-pointer border-primary'
                              />
                            </IGRPFormControlPrimitive>
                            <IGRPFormLabelPrimitive className='font-normal'>
                              Grupo
                            </IGRPFormLabelPrimitive>
                          </IGRPFormItemPrimitive>
                          <IGRPFormItemPrimitive className='flex'>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupItemPrimitive
                                value='FOLDER'
                                className='cursor-pointer border-primary'
                              />
                            </IGRPFormControlPrimitive>
                            <IGRPFormLabelPrimitive className='font-normal'>
                              Pasta
                            </IGRPFormLabelPrimitive>
                          </IGRPFormItemPrimitive>
                          
                          <IGRPFormItemPrimitive className='flex'>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupItemPrimitive
                                value='EXTERNAL_PAGE'
                                className='cursor-pointer border-primary'
                              />
                            </IGRPFormControlPrimitive>
                            <IGRPFormLabelPrimitive className='font-normal'>
                              Menu Externo
                            </IGRPFormLabelPrimitive>
                          </IGRPFormItemPrimitive>
                        </IGRPRadioGroupPrimitive>
                      </IGRPFormControlPrimitive>
                      {/* <IGRPFormDescriptionPrimitive>
                        Selecionar tipo de menu.
                      </IGRPFormDescriptionPrimitive> */}
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive 
                        className='after:content-["*"] after:text-destructive gap-0.5'
                      >
                        Estado
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPRadioGroupPrimitive
                          onValueChange={field.onChange}
                          value={field.value}
                          orientation='vertical'                          
                        >
                          <IGRPFormItemPrimitive className='flex items-center'>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupItemPrimitive
                                value='ACTIVE'
                                className='cursor-pointer border-primary'
                              />
                            </IGRPFormControlPrimitive>
                            <IGRPFormLabelPrimitive className='font-normal'>
                              Ativo
                            </IGRPFormLabelPrimitive>
                          </IGRPFormItemPrimitive>
                          <IGRPFormItemPrimitive className='flex items-center'>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupItemPrimitive
                                value='INACTIVE'
                                className='cursor-pointer border-primary'
                              />
                            </IGRPFormControlPrimitive>
                            <IGRPFormLabelPrimitive className='font-normal'>
                              Inativo
                            </IGRPFormLabelPrimitive>
                          </IGRPFormItemPrimitive>
                        </IGRPRadioGroupPrimitive>
                      </IGRPFormControlPrimitive>
                      {/* <IGRPFormDescriptionPrimitive>
                        Indica se o menu está ativo ou inativo.
                      </IGRPFormDescriptionPrimitive> */}
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                {/* {isMenuPage && (
                  <IGRPFormFieldPrimitive
                    control={form.control}
                    name='resourceId'
                    render={({ field }) => (
                      <IGRPFormItemPrimitive className='flex flex-col'>
                        <IGRPFormLabelPrimitive>Resource *</IGRPFormLabelPrimitive>
                        <IGRPPopoverPrimitive>
                          <IGRPPopoverTriggerPrimitive asChild>
                            <IGRPFormControlPrimitive>
                              <IGRPButtonPrimitive
                                variant='outline'
                                role='combobox'
                                disabled={resourcesLoading}
                                className={cn(
                                  'justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {resourcesLoading
                                  ? 'Loading resources...'
                                  : field.value
                                    ? resources.find((resource) => resource.id === field.value)
                                        ?.name || 'Resource not found'
                                    : 'Select resource...'}
                                <IGRPIcon iconName='ChevronsUpDown' className='opacity-50' />
                              </IGRPButtonPrimitive>
                            </IGRPFormControlPrimitive>
                          </IGRPPopoverTriggerPrimitive>
                          <IGRPPopoverContentPrimitive
                            className='w-[--radix-popover-trigger-width] p-0'
                            align='start'
                          >
                            <IGRPCommandPrimitive>
                              <IGRPCommandInputPrimitive
                                placeholder='Search resources...'
                                className='h-9'
                              />
                              <IGRPCommandListPrimitive>
                                <IGRPCommandEmptyPrimitive>
                                  No resources found.
                                </IGRPCommandEmptyPrimitive>
                                <IGRPCommandGroupPrimitive>
                                  {resources.map((resource) => (
                                    <IGRPCommandItemPrimitive
                                      value={resource.name}
                                      key={resource.id}
                                      onSelect={() => {
                                        form.setValue('resourceId', resource.id);
                                      }}
                                    >
                                      <div className='flex flex-col'>
                                        <span>{resource.name}</span>
                                        <span className='text-xs text-muted-foreground'>
                                          {resource.type} • ID: {resource.id}
                                        </span>
                                      </div>
                                      <IGRPIcon 
                                        iconName='Check'
                                        className={cn(
                                          'ml-auto opacity-0',
                                          resource.id === field.value && 'opacity-100',
                                        )}
                                      />
                                    </IGRPCommandItemPrimitive>
                                  ))}
                                </IGRPCommandGroupPrimitive>
                              </IGRPCommandListPrimitive>
                            </IGRPCommandPrimitive>
                          </IGRPPopoverContentPrimitive>
                        </IGRPPopoverPrimitive>
                        <IGRPFormDescriptionPrimitive>
                          Select the resource this menu page will link to.
                        </IGRPFormDescriptionPrimitive>
                        <IGRPFormMessagePrimitive />
                      </IGRPFormItemPrimitive>
                    )}
                  />
                )} */}

                {isExternalPage && (
                  <>
                    <IGRPFormFieldPrimitive
                      control={form.control}
                      name='url'
                      render={({ field }) => (
                        <IGRPFormItemPrimitive>
                          <IGRPFormLabelPrimitive
                            className='after:content-["*"] after:text-destructive gap-0.5'
                          >
                            URL
                          </IGRPFormLabelPrimitive>
                          <IGRPFormControlPrimitive>
                            <IGRPInputPrimitive
                              placeholder='https://example.com'
                              {...field}
                            />
                          </IGRPFormControlPrimitive>
                          <IGRPFormDescriptionPrimitive>
                            URL externo da página.
                          </IGRPFormDescriptionPrimitive>
                          <IGRPFormMessagePrimitive />
                        </IGRPFormItemPrimitive>
                      )}
                    />

                    <IGRPFormFieldPrimitive
                      control={form.control}
                      name='target'
                      render={({ field }) => (
                        <IGRPFormItemPrimitive>
                          <IGRPFormLabelPrimitive>Abrir em</IGRPFormLabelPrimitive>
                          <IGRPFormControlPrimitive>
                            <IGRPRadioGroupPrimitive
                              onValueChange={field.onChange}
                              value={field.value}
                              className='flex flex-row space-x-4'
                            >
                              <IGRPFormItemPrimitive className='flex items-center'>
                                <IGRPFormControlPrimitive>
                                  <IGRPRadioGroupItemPrimitive
                                    value='INTERNAL'
                                    className='cursor-pointer border-primary'
                                  />
                                </IGRPFormControlPrimitive>
                                <IGRPFormLabelPrimitive className='font-normal'>
                                  Mesma aba
                                </IGRPFormLabelPrimitive>
                              </IGRPFormItemPrimitive>
                              <IGRPFormItemPrimitive className='flex items-center'>
                                <IGRPFormControlPrimitive>
                                  <IGRPRadioGroupItemPrimitive
                                    value='EXTERNAL'
                                    className='cursor-pointer border-primary'
                                  />
                                </IGRPFormControlPrimitive>
                                <IGRPFormLabelPrimitive className='font-normal'>
                                  Nova Aba
                                </IGRPFormLabelPrimitive>
                              </IGRPFormItemPrimitive>
                            </IGRPRadioGroupPrimitive>
                          </IGRPFormControlPrimitive>
                          <IGRPFormDescriptionPrimitive>
                            Como abrir o link externo.
                          </IGRPFormDescriptionPrimitive>
                          <IGRPFormMessagePrimitive />
                        </IGRPFormItemPrimitive>
                      )}
                    />
                  </>
                )}

                {parentMenus.length > 0 && (
                  <IGRPFormFieldPrimitive
                    control={form.control}
                    name='parentCode'
                    render={({ field }) => (
                      <IGRPFormItemPrimitive className='flex flex-col'>
                        <IGRPFormLabelPrimitive>
                          Menu Pai
                        </IGRPFormLabelPrimitive>
                        <IGRPPopoverPrimitive>
                          <IGRPPopoverTriggerPrimitive asChild>
                            <IGRPFormControlPrimitive>
                              <IGRPButtonPrimitive
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value
                                  ? parentMenus.find((menu) => menu.code === field.value)?.name
                                  : 'Select Parent Menu...'}
                                <IGRPIcon iconName='ChevronsUpDown' className='opacity-50' />
                              </IGRPButtonPrimitive>
                            </IGRPFormControlPrimitive>
                          </IGRPPopoverTriggerPrimitive>
                          <IGRPPopoverContentPrimitive
                            className='w-[--radix-popover-trigger-width] p-0'
                            align='start'
                          >
                            <IGRPCommandPrimitive>
                              <IGRPCommandInputPrimitive
                                placeholder='Search menu...'
                                className='h-9'
                              />
                              <IGRPCommandListPrimitive>
                                <IGRPCommandEmptyPrimitive>
                                  Nenhum menu encontrado.
                                </IGRPCommandEmptyPrimitive>
                                <IGRPCommandGroupPrimitive>
                                  <IGRPCommandItemPrimitive
                                    value='none'
                                    onSelect={() => {
                                      form.setValue('parentCode', '');
                                    }}
                                  >
                                    Sem menu pai (menu raiz)
                                    <IGRPIcon
                                      iconName='Check'
                                      className={cn(
                                        'ml-auto opacity-0',
                                        field.value === null && 'opacity-100',
                                      )}
                                    />
                                  </IGRPCommandItemPrimitive>
                                  {parentMenus.map((menu) => (
                                    <IGRPCommandItemPrimitive
                                      value={menu.id?.toString() || ''}
                                      key={`menu-${menu.id}`}
                                      onSelect={() => {
                                        form.setValue('parentCode', menu.code || '');
                                      }}
                                    >
                                      {menu.name}
                                      <IGRPIcon
                                        iconName='Check'
                                        className={cn(
                                          'ml-auto opacity-0',
                                          menu.code === field.value && 'opacity-100',
                                        )}
                                      />
                                    </IGRPCommandItemPrimitive>
                                  ))}
                                </IGRPCommandGroupPrimitive>
                              </IGRPCommandListPrimitive>
                            </IGRPCommandPrimitive>
                          </IGRPPopoverContentPrimitive>
                        </IGRPPopoverPrimitive>
                        <IGRPFormDescriptionPrimitive>
                          Selecione um menu pai para criar um sub-menu.
                        </IGRPFormDescriptionPrimitive>
                        <IGRPFormMessagePrimitive />
                      </IGRPFormItemPrimitive>
                    )}
                  />
                )}

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='position'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>
                        Position
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          type='number'
                          min='0'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        Posição do menu para ordenação.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='icon'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive className='flex flex-col'>
                      <IGRPFormLabelPrimitive>Icon *</IGRPFormLabelPrimitive>
                      <IGRPPopoverPrimitive>
                        <IGRPPopoverTriggerPrimitive asChild>
                          <IGRPFormControlPrimitive>
                            <IGRPButtonPrimitive
                              variant='outline'
                              role='combobox'
                              className={cn(
                                'justify-between',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {currentIcon ? (
                                <div className='flex items-center gap-2'>
                                  <IGRPIcon iconName={currentIcon.value} className='size-4' />
                                  <span>{currentIcon.label}</span>
                                </div>
                              ) : (
                                'Select menu icon...'
                              )}
                              <IGRPIcon iconName='ChevronsUpDown' className='opacity-50' />
                            </IGRPButtonPrimitive>
                          </IGRPFormControlPrimitive>
                        </IGRPPopoverTriggerPrimitive>
                        <IGRPPopoverContentPrimitive
                          className='w-[--radix-popover-trigger-width] p-0'
                          align='start'
                        >
                          <IGRPCommandPrimitive>
                            <IGRPCommandInputPrimitive placeholder='Procurar ícone...' />
                            <IGRPCommandListPrimitive className='max-h-80'>
                              <IGRPCommandEmptyPrimitive>Nenhum ícone encontrado.</IGRPCommandEmptyPrimitive>
                              <IGRPCommandGroupPrimitive>
                                {LUCIDE_ICON_OPTIONS.map((iconData) => (
                                  <IGRPCommandItemPrimitive
                                    key={iconData.value}
                                    value={iconData.label}
                                    onSelect={() => {
                                      field.onChange(iconData.value);
                                    }}
                                  >
                                    <div className='flex items-center gap-2'>
                                      <IGRPIcon iconName={iconData.value} className='size-4' />
                                      <span>{iconData.label}</span>
                                    </div>
                                    <IGRPIcon
                                      iconName='Check'
                                      className={cn(
                                        'ml-auto opacity-0',
                                        iconData.value === field.value && 'opacity-100',
                                      )}
                                    />
                                  </IGRPCommandItemPrimitive>
                                ))}
                              </IGRPCommandGroupPrimitive>
                            </IGRPCommandListPrimitive>
                          </IGRPCommandPrimitive>
                        </IGRPPopoverContentPrimitive>
                      </IGRPPopoverPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        Select an icon for the menu (required).
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              </div>
              <IGRPDialogFooterPrimitive>
                <IGRPButtonPrimitive
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : menu ? 'Update Menu' : 'Create Menu'}
                </IGRPButtonPrimitive>
              </IGRPDialogFooterPrimitive>
            </form>
          </IGRPFormPrimitive>
        </IGRPScrollAreaPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
