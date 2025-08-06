'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, icons } from 'lucide-react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPCommandPrimitive, IGRPCommandEmptyPrimitive, IGRPCommandGroupPrimitive, IGRPCommandInputPrimitive, IGRPCommandItemPrimitive, IGRPCommandListPrimitive} from '@igrp/igrp-framework-react-design-system'

import { IGRPDialogPrimitive,  IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogFooterPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormPrimitive, IGRPFormControlPrimitive, IGRPFormDescriptionPrimitive, IGRPFormFieldPrimitive, IGRPFormItemPrimitive, IGRPFormLabelPrimitive} from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPPopoverPrimitive, IGRPPopoverContentPrimitive, } from '@igrp/igrp-framework-react-design-system'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useResourcesByApplication } from '@/features/resources/hooks/use-resources';
import { MenuFormData } from '../types';
import { createMenuSchema } from '../schemas/menu';
import z from 'zod';

const formatIconName = (iconName: string) => {
  return iconName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const LUCIDE_ICONS = Object.entries(icons)
  .map(([key, IconComponent]) => ({
    value: key,
    label: formatIconName(key),
    icon: IconComponent,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: MenuFormData;
  onSave: (values: z.infer<typeof createMenuSchema>, id?: number) => void;
  parentMenus: MenuFormData[];
  applicationId: number;
}

export function MenuFormDialog({
  open,
  onOpenChange,
  menu,
  onSave,
  parentMenus,
  applicationId,
}: MenuFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { data: resources = [], isLoading: resourcesLoading } =
    useResourcesByApplication(applicationId);

  const form = useForm<MenuFormData>({
    defaultValues: {
      name: '',
      type: 'FOLDER',
      position: 0,
      icon: 'app-window',
      status: 'ACTIVE',
      target: 'INTERNAL',
      url: '',
      parentId: null,
      applicationId: applicationId,
      resourceId: null,
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
          parentId: menu.parentId || null,
          applicationId: menu.applicationId,
          resourceId: menu.resourceId || null,
        });
      } else {
        form.reset({
          name: '',
          type: 'FOLDER',
          position: 0,
          icon: 'app-window',
          status: 'ACTIVE',
          target: 'INTERNAL',
          url: '',
          parentId: null,
          applicationId: applicationId,
          resourceId: null,
        });
      }
    }
  }, [menu, form, open, applicationId]);

  function onSubmit(values: MenuFormData) {
    if (!values.name.trim()) {
      form.setError('name', { message: 'Name is required' });
      return;
    }

    if (values.type === 'EXTERNAL_PAGE' && values.url && !values.url.trim()) {
      form.setError('url', { message: 'URL is required for external page menus' });
      return;
    }

    if (values.type === 'MENU_PAGE' && !values.resourceId) {
      form.setError('resourceId', { message: 'Resource is required for menu page type' });
      return;
    }

    if (values.applicationId <= 0) {
      form.setError('applicationId', { message: 'Application ID is required' });
      return;
    }

    const payload: Partial<MenuFormData> = {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      target: values.target,
      parentId: values.parentId,
      applicationId: values.applicationId,
    };

    if (values.type === 'EXTERNAL_PAGE') {
      payload.url = values.url;
    } else if (values.type === 'MENU_PAGE') {
      payload.resourceId = values.resourceId;
    }

    setIsLoading(true);
    try {
      onSave(payload as z.infer<typeof createMenuSchema>, menu?.id);
      onOpenChange(false);
    } catch (err) {
      toast.error('Something went wrong. Please try again.', {
        description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isMenuPage = form.watch('type') === 'MENU_PAGE';
  const isExternalPage = form.watch('type') === 'EXTERNAL_PAGE';
  const selectedIcon = form.watch('icon');

  const currentIcon = LUCIDE_ICONS.find((icon) => icon.value === selectedIcon);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-[600px] p-4'>
        <DialogHeader>
          <DialogTitle>{menu ? 'Edit Menu' : 'Create Menu'}</DialogTitle>
          <DialogDescription>
            {menu
              ? 'Update the details of this menu item.'
              : 'Add a new menu item to your application.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[90vh]'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6 p-2'
            >
              <div className='grid grid-cols-1 gap-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Menu name'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>The display name of the menu.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset fields when changing type
                            if (value === 'FOLDER') {
                              form.setValue('resourceId', null);
                              form.setValue('url', '');
                            } else if (value === 'MENU_PAGE') {
                              form.setValue('url', '');
                            } else if (value === 'EXTERNAL_PAGE') {
                              form.setValue('resourceId', null);
                            }
                          }}
                          value={field.value}
                          className='flex flex-row space-x-4'
                        >
                          <FormItem className='flex items-center space-x-2'>
                            <FormControl>
                              <RadioGroupItem
                                value='FOLDER'
                                className='cursor-pointer border-primary'
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>Folder</FormLabel>
                          </FormItem>
                          <FormItem className='flex items-center space-x-2'>
                            <FormControl>
                              <RadioGroupItem
                                value='MENU_PAGE'
                                className='cursor-pointer border-primary'
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>Menu Page</FormLabel>
                          </FormItem>
                          <FormItem className='flex items-center space-x-2'>
                            <FormControl>
                              <RadioGroupItem
                                value='EXTERNAL_PAGE'
                                className='cursor-pointer border-primary'
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>External Page</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Select the menu type.</FormDescription>
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
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className='flex flex-row space-x-6'
                        >
                          <FormItem className='flex items-center space-x-2'>
                            <FormControl>
                              <RadioGroupItem
                                value='ACTIVE'
                                className='cursor-pointer border-primary'
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>Active</FormLabel>
                          </FormItem>
                          <FormItem className='flex items-center space-x-2'>
                            <FormControl>
                              <RadioGroupItem
                                value='INACTIVE'
                                className='cursor-pointer border-primary'
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>Inactive</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Whether the menu is active, inactive .</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isMenuPage && (
                  <FormField
                    control={form.control}
                    name='resourceId'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>Resource *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
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
                                <ChevronsUpDown className='opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className='w-[--radix-popover-trigger-width] p-0'
                            align='start'
                          >
                            <Command>
                              <CommandInput
                                placeholder='Search resources...'
                                className='h-9'
                              />
                              <CommandList>
                                <CommandEmpty>No resources found.</CommandEmpty>
                                <CommandGroup>
                                  {resources.map((resource) => (
                                    <CommandItem
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
                                      <Check
                                        className={cn(
                                          'ml-auto opacity-0',
                                          resource.id === field.value && 'opacity-100',
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Select the resource this menu page will link to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isExternalPage && (
                  <>
                    <FormField
                      control={form.control}
                      name='url'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='https://example.com'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>External URL for the page.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='target'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className='flex flex-row space-x-4'
                            >
                              <FormItem className='flex items-center space-x-2'>
                                <FormControl>
                                  <RadioGroupItem
                                    value='INTERNAL'
                                    className='cursor-pointer border-primary'
                                  />
                                </FormControl>
                                <FormLabel className='font-normal'>Same Window</FormLabel>
                              </FormItem>
                              <FormItem className='flex items-center space-x-2'>
                                <FormControl>
                                  <RadioGroupItem
                                    value='EXTERNAL'
                                    className='cursor-pointer border-primary'
                                  />
                                </FormControl>
                                <FormLabel className='font-normal'>New Window</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>How to open the external link.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {parentMenus.length > 0 && (
                  <FormField
                    control={form.control}
                    name='parentId'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>Parent Menu</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value
                                  ? parentMenus.find((menu) => menu.id === field.value)?.name
                                  : 'Select Parent Menu...'}
                                <ChevronsUpDown className='opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className='w-[--radix-popover-trigger-width] p-0'
                            align='start'
                          >
                            <Command>
                              <CommandInput
                                placeholder='Search menu...'
                                className='h-9'
                              />
                              <CommandList>
                                <CommandEmpty>No Menu found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value='none'
                                    onSelect={() => {
                                      form.setValue('parentId', null);
                                    }}
                                  >
                                    No Parent (Root Menu)
                                    <Check
                                      className={cn(
                                        'ml-auto opacity-0',
                                        field.value === null && 'opacity-100',
                                      )}
                                    />
                                  </CommandItem>
                                  {parentMenus.map((menu) => (
                                    <CommandItem
                                      value={menu.id?.toString() || ''}
                                      key={`menu-${menu.id}`}
                                      onSelect={() => {
                                        form.setValue('parentId', menu.id || null);
                                      }}
                                    >
                                      {menu.name}
                                      <Check
                                        className={cn(
                                          'ml-auto opacity-0',
                                          menu.id === field.value && 'opacity-100',
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Select a parent menu to create a submenu.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='position'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Menu position for ordering.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='icon'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Icon *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              role='combobox'
                              className={cn(
                                'justify-between',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {currentIcon ? (
                                <div className='flex items-center gap-2'>
                                  <currentIcon.icon className='w-4 h-4' />
                                  <span>{currentIcon.label}</span>
                                </div>
                              ) : (
                                'Select menu icon...'
                              )}
                              <ChevronsUpDown className='opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className='w-[--radix-popover-trigger-width] p-0'
                          align='start'
                        >
                          <Command>
                            <CommandInput placeholder='Procurar ícone...' />
                            <CommandList className='max-h-80'>
                              <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
                              <CommandGroup>
                                {LUCIDE_ICONS.map((iconData) => (
                                  <CommandItem
                                    key={iconData.value}
                                    value={iconData.label}
                                    onSelect={() => {
                                      field.onChange(iconData.value);
                                    }}
                                  >
                                    <div className='flex items-center gap-2'>
                                      <iconData.icon className='w-4 h-4' />
                                      <span>{iconData.label}</span>
                                    </div>
                                    <Check
                                      className={cn(
                                        'ml-auto opacity-0',
                                        iconData.value === field.value && 'opacity-100',
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Select an icon for the menu (required).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : menu ? 'Update Menu' : 'Create Menu'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
