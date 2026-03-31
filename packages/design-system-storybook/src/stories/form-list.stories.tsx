import { useState, useRef } from 'react';
import z from 'zod';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPFormList,
  IGRPInputText,
  IGRPInputNumber,
  IGRPCheckbox,
  IGRPSelect,
  IGRPCombobox,
  IGRPButton,
  IGRPIcon,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  IGRPForm,
  type IGRPFormHandle,
  type IGRPOptionsProps,
  cn,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPFormList> = {
  title: 'Components/FormList',
  component: IGRPFormList,
  argTypes: {
    allowMultipleOpen: {
      control: 'boolean',
      description: 'When true, multiple items can be expanded at once. When false, opening one closes the others.',
    },
  },
};
export default meta;

const SocialSchema = z.object({
  socials: z.array(
    z.object({
      label: z.string().min(1, 'Required'),
      label1: z.string().min(1, 'Required'),
    }),
  ),
});

const schema = SocialSchema;

type FormValues = z.infer<typeof schema>;

const mockOptions: IGRPOptionsProps[] = [
  {
    value: 'apple',
    label: 'Apple',
    status: 'success',
    icon: 'Apple',
    description: 'A sweet red fruit',
    group: 'Fruits',
  },
  {
    value: 'banana',
    label: 'Banana',
    status: 'warning',
    icon: 'Banana',
    description: 'A yellow fruit rich in potassium',
    group: 'Fruits',
  },
  {
    value: 'carrot',
    label: 'Carrot',
    status: 'info',
    icon: 'Carrot',
    description: 'An orange root vegetable',
    group: 'Vegetables',
  },
  {
    value: 'broccoli',
    label: 'Broccoli',
    status: 'success',
    icon: 'Leaf',
    description: 'A green vegetable',
    group: 'Vegetables',
  },
  {
    value: 'cheeseburger',
    label: 'Cheeseburger',
    status: 'destructive',
    icon: 'Flame',
    description: 'A fast food favorite',
    group: 'Fast Food',
  },
  {
    value: 'user_1',
    label: 'Jane Doe',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    description: 'Product Manager',
    status: 'primary',
    group: 'Users',
  },
  {
    value: 'user_2',
    label: 'John Smith',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    description: 'Software Engineer',
    status: 'success',
    group: 'Users',
  },
  {
    value: 'user_3',
    label: 'Alice Nguyen',
    image: 'https://randomuser.me/api/portraits/women/3.jpg',
    description: 'UX Designer',
    status: 'info',
    group: 'Users',
  },
];

type ActividadeEconomicaItem = {
  idActividadeEconomica: string;
  taxa: number;
  principal: boolean;
};

const selectidActividadeEconomicaOptions: (IGRPOptionsProps & { taxa: number })[] = [
  {
    value: 'construction',
    label:
      'Construção civil, incluindo obras públicas, privadas e infraestruturas complexas que exigem planeamento urbano, gestão de materiais e equipas multidisciplinares especializadas',
    description: 'Obras públicas e privadas',
    taxa: 1200,
  },
  {
    value: 'tourism',
    label:
      'Turismo e hotelaria com foco em resorts, alojamentos locais, restauração e experiências culturais prolongadas que envolvem atendimento personalizado e gestão de visitantes internacionais',
    description: 'Hotéis, agências de viagens e turismo',
    taxa: 950,
  },
  {
    value: 'it-services',
    label:
      'Tecnologias de informação, desenvolvimento de software, consultoria, suporte técnico, integração de sistemas empresariais e serviços geridos para operações críticas de negócio',
    description: 'Serviços de software e consultoria',
    taxa: 800,
  },
  {
    value: 'retail',
    label:
      'Comércio e retalho em lojas físicas e canais digitais, incluindo gestão de inventário, logística, atendimento omnicanal e promoção contínua de produtos para diversos segmentos',
    description: 'Lojas, supermercados e comércio a retalho',
    taxa: 675,
  },
];

const formListactividadesEconomicasDefault: ActividadeEconomicaItem = {
  idActividadeEconomica: '',
  taxa: 0,
  principal: false,
};

const actividadesEconomicasBadgeValue = 'SOAT';

const renderLabel = (item: ActividadeEconomicaItem, index: number) => {
  const option = selectidActividadeEconomicaOptions.find(
    (opt) => opt.value === item.idActividadeEconomica,
  );
  const baseLabel = option?.label ?? `Item ${index + 1}`;
  return item.principal ? `${baseLabel} (Principal)` : baseLabel;
};

const defaultItem = { label: '', label1: '' };
const customRemoveDefaultValues: FormValues = {
  socials: [
    { label: 'Twitter', label1: 'user_1' },
    { label: 'LinkedIn', label1: 'user_2' },
  ],
};

const renderItem = (_: FormValues['socials'][0], index: number) => (
  <div className='grid gap-4'>
    <IGRPInputText
      name={`socials.${index}.label`}
      label='Nome'
      required
      helperText='Insira useu Nome'
    />
    <IGRPSelect
      name={`socials.${index}.label1`}
      label='Choose an item'
      placeholder='Select one'
      options={mockOptions}
      showSearch={true}
      showGroup={true}
      showStatus={true}
      helperText='You can search by name'
    />
  </div>
);

const Template = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        onSubmit={(data) => console.log(data)}
      >
        <IGRPFormList
          id='repeater-example'
          name='socials'
          label='Social'
          description='Adicione links sociais'
          badgeValue='obrigatório'
          defaultItem={defaultItem}
          renderItem={renderItem}
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? item.label1 : `Item ${index + 1}`
          }
        />
      </IGRPForm>
    </div>
  );
};

export const FormListBasic: StoryObj = {
  render: () => <Template />,
};

const OptionalTemplate = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={{ socials: [] }}
        onSubmit={(data) => console.log('Form submitted (optional):', data)}
      >
        <IGRPFormList
          id='optional-example'
          name='socials'
          label='Optional Social Links'
          description='Adicione links sociais apenas se necessário'
          badgeValue='opcional'
          defaultItem={defaultItem}
          renderItem={renderItem}
          allowEmpty
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? item.label1 : `Item ${index + 1}`
          }
        />
      </IGRPForm>
    </div>
  );
};

export const FormListOptional: StoryObj = {
  render: () => <OptionalTemplate />,
};

const AllowMultipleOpenTemplate = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  return (
    <div className='mx-auto px-6 py-8'>
      <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-md'>
        <p className='text-sm font-medium text-green-900 mb-1'>
          ✨ allowMultipleOpen Demo
        </p>
        <p className='text-xs text-green-700'>
          Multiple items can be expanded at once. Opening one does not close the others.
        </p>
      </div>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={{
          socials: [
            { label: 'Twitter', label1: 'user_1' },
            { label: 'LinkedIn', label1: 'user_2' },
            { label: 'GitHub', label1: 'apple' },
          ],
        }}
        onSubmit={(data) => console.log('Form submitted (allowMultipleOpen):', data)}
      >
        <IGRPFormList
          id='allow-multiple-open-example'
          name='socials'
          label='Social Links'
          description='Expand multiple items at once'
          badgeValue='allowMultipleOpen'
          defaultItem={defaultItem}
          renderItem={renderItem}
          allowMultipleOpen
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
          }
        />
      </IGRPForm>
    </div>
  );
};

export const FormListAllowMultipleOpen: StoryObj = {
  render: () => <AllowMultipleOpenTemplate />,
};

const FormListCustomRemoveActionTemplate = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);
  const [blockRemove, setBlockRemove] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<{
    item: FormValues['socials'][0];
    index: number;
  } | null>(null);

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={customRemoveDefaultValues}
        onSubmit={(data) => console.log('Form submitted (custom remove action):', data)}
      >
        <IGRPFormList
          id='custom-remove-action-example'
          name='socials'
          label='Social Links'
          description='Custom remove button with renderRemoveAction + AlertDialog. onItemRemove runs first.'
          badgeValue='custom remove'
          defaultItem={defaultItem}
          renderItem={renderItem}
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
          }
          onItemRemove={(item, index) => {
            if (blockRemove) {
              throw new Error('Blocked by onItemRemove callback');
            }
            setLastRemoved({ item, index });
            console.log('onItemRemove callback:', { item, index });
          }}
          renderRemoveAction={({ ariaLabel, onRemove, onTriggerClick }) => (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <IGRPButton
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  onClick={onTriggerClick}
                  className='size-7 p-0 shrink-0 hover:text-destructive'
                  aria-label={ariaLabel}
                >
                  <IGRPIcon iconName='Trash2' />
                </IGRPButton>
              </AlertDialogTrigger>

              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acao vai remover este item da lista e nao pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-destructive text-white hover:bg-destructive/90'
                    onClick={onRemove}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        />
      </IGRPForm>
      <div className='mt-4 p-4 bg-muted rounded-md'>
        <div className='mb-3'>
          <IGRPButton
            type='button'
            variant={blockRemove ? 'destructive' : 'outline'}
            size='sm'
            onClick={() => setBlockRemove((prev) => !prev)}
          >
            {blockRemove ? 'Blocking remove (onItemRemove throws)' : 'Allowing remove'}
          </IGRPButton>
          <p className='text-xs text-muted-foreground mt-2'>
            Toggle to test the new flow: `onItemRemove` executes first; if it throws, the item is not
            removed.
          </p>
        </div>
        <p className='text-sm text-muted-foreground mb-2'>Last removed item callback:</p>
        {lastRemoved ? (
          <pre className='text-xs overflow-auto'>{JSON.stringify(lastRemoved, null, 2)}</pre>
        ) : (
          <p className='text-xs text-muted-foreground italic'>No items removed yet</p>
        )}
      </div>
    </div>
  );
};

export const FormListRenderRemoveActionAlertDialog: StoryObj = {
  render: () => <FormListCustomRemoveActionTemplate />,
};

// Standalone version with allowEmpty - starts empty
const AllowEmptyStandaloneTemplate = () => {
  const [items, setItems] = useState<StandaloneItem[]>([]);

  const renderStandaloneItem = (
    item: StandaloneItem,
    _index: number,
    onChange?: (item: StandaloneItem) => void,
  ) => (
    <div className='grid gap-4'>
      <IGRPInputText
        label='Nome'
        required
        helperText='Insira seu Nome'
        value={item.label}
        onChange={(e) => onChange?.({ ...item, label: e.target.value })}
      />
      <IGRPCombobox
        label='Choose an item'
        placeholder='Select one'
        options={mockOptions}
        showSearch={true}
        showGroup={true}
        showStatus={true}
        helperText='You can search by name'
        value={item.label1}
        onChange={(value) => onChange?.({ ...item, label1: value as string })}
      />
    </div>
  );

  return (
    <div className='mx-auto px-6 py-8'>
      <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md'>
        <p className='text-sm font-medium text-blue-900 mb-1'>
          ✨ allowEmpty Demo
        </p>
        <p className='text-xs text-blue-700'>
          This form list starts empty. Click "Add" to add items. You can remove all items including the last one.
        </p>
      </div>
      <IGRPFormList<StandaloneItem>
        id='allow-empty-example'
        label='Social Links'
        description='Start empty and add items as needed'
        badgeValue='allowEmpty'
        defaultItem={{ label: '', label1: '' }}
        allowEmpty
        value={items}
        onChange={setItems}
        renderItem={renderStandaloneItem}
        computeLabel={(item: StandaloneItem, index: number) =>
          item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
        }
      />
      <div className='mt-4 p-4 bg-muted rounded-md'>
        <p className='text-sm text-muted-foreground mb-2'>
          Current values ({items.length} {items.length === 1 ? 'item' : 'items'}):
        </p>
        {items.length === 0 ? (
          <p className='text-xs text-muted-foreground italic'>No items added yet</p>
        ) : (
          <pre className='text-xs overflow-auto'>
            {JSON.stringify(items, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export const FormListAllowEmpty: StoryObj = {
  render: () => <AllowEmptyStandaloneTemplate />,
};

// Form version with allowEmpty - starts empty
const AllowEmptyFormTemplate = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  return (
    <div className='mx-auto px-6 py-8'>
      <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md'>
        <p className='text-sm font-medium text-blue-900 mb-1'>
          ✨ allowEmpty with Form Context
        </p>
        <p className='text-xs text-blue-700'>
          This form list starts completely empty. Click "Add Social" to add items. You can remove all items including the last one.
        </p>
      </div>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={{ socials: [] }}
        onSubmit={(data) => {
          console.log('Form submitted (allowEmpty):', data);
          alert(`Form submitted with ${data.socials.length} items!`);
        }}
      >
        <IGRPFormList
          id='allow-empty-form-example'
          name='socials'
          label='Social'
          description='Start empty and add items as needed'
          badgeValue='allowEmpty'
          defaultItem={defaultItem}
          allowEmpty
          renderItem={renderItem}
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
          }
        />
        <div className='mt-4 flex gap-2'>
          <button
            type='button'
            onClick={() => {
              const data = formRef.current?.getValues();
              console.log('Current form values:', data);
              alert(`Current form has ${data?.socials?.length || 0} items`);
            }}
            className='px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm'
          >
            Check Values
          </button>
          <button
            type='button'
            onClick={() => formRef.current?.submit()}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm'
          >
            Submit Form
          </button>
        </div>
      </IGRPForm>
    </div>
  );
};

export const FormListAllowEmptyForm: StoryObj = {
  render: () => <AllowEmptyFormTemplate />,
};

const ActividadesEconomicasTemplate = () => {
  const [items, setItems] = useState<ActividadeEconomicaItem[]>([
    formListactividadesEconomicasDefault,
  ]);

  return (
    <>
      <IGRPFormList<ActividadeEconomicaItem>
        id='actividadesEconomicas'
        label='Sector de Actividade/SOAT'
        color='primary'
        variant='solid'
        addButtonLabel='Add'
        iconName='Briefcase'
        addButtonIconName='Plus'
        value={items}
        onChange={setItems}
        renderItem={(item, index, onChange) => {
          const handleActividadeChange = (value: string) => {
            const option = selectidActividadeEconomicaOptions.find(
              (opt) => opt.value === value,
            );
            onChange?.({
              ...item,
              idActividadeEconomica: value,
              taxa: option?.taxa ?? 0,
            });
          };

          return (
            <div className={cn('grid', 'grid-cols-2 ', 'md:grid-cols-2 ', 'lg:grid-cols-2 ', ' gap-4',)}>
              <IGRPCombobox
                id={`actividadesEconomicas.${index}.idActividadeEconomica`}
                label='Actividade'
                variant='single'
                placeholder='Select an option...'
                required
                selectLabel='No option found'
                showSearch
                showIcon={false}
                iconName='CornerDownRight'
                className={cn('col-span-1')}
                value={item.idActividadeEconomica}
                onChange={(value) => handleActividadeChange(value as string)}
                options={selectidActividadeEconomicaOptions}
              />
              <IGRPInputNumber
                id={`actividadesEconomicas.${index}.taxa`}
                label='SOAT'
                max={9999999}
                step={1}
                required
                disabled
                className={cn('col-span-1')}
                value={item.taxa}
                onChange={(value) =>
                  onChange?.({
                    ...item,
                    taxa: Number(value) || 0,
                  })
                }
              />
              <IGRPCheckbox
                id={`actividadesEconomicas.${index}.principal`}
                label='Principal'
                className={cn('col-span-1')}
                checked={item.principal}
                onCheckedChange={(checked) =>
                  onChange?.({
                    ...item,
                    principal: Boolean(checked),
                  })
                }
              />
            </div>
          );
        }}
        computeLabel={(item: ActividadeEconomicaItem, index: number) =>
          `${renderLabel(item, index)}`
        }
        className={cn()}
        defaultItem={formListactividadesEconomicasDefault}
        badgeValue={actividadesEconomicasBadgeValue}
      />
      <div className='mt-4 p-4 bg-muted rounded-md'>
        <p className='text-sm text-muted-foreground mb-2'>
          Current activities ({items.length} {items.length === 1 ? 'item' : 'items'}):
        </p>
        <pre className='text-xs overflow-auto'>
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    </>
  );
};

export const FormListEconomicActivities: StoryObj = {
  render: () => <ActividadesEconomicasTemplate />,
};

// Standalone version without form context
type StandaloneItem = {
  label: string;
  label1: string;
};

const StandaloneTemplate = () => {
  const [items, setItems] = useState<StandaloneItem[]>([
    { label: '', label1: '' },
  ]);

  const renderStandaloneItem = (
    item: StandaloneItem,
    _index: number,
    onChange?: (item: StandaloneItem) => void,
  ) => (
    <div className='grid gap-4'>
      <IGRPInputText
        label='Nome'
        required
        helperText='Insira seu Nome'
        value={item.label}
        onChange={(e) => onChange?.({ ...item, label: e.target.value })}
      />
      <IGRPCombobox
        label='Choose an item'
        placeholder='Select one'
        options={mockOptions}
        showSearch={true}
        showGroup={true}
        showStatus={true}
        helperText='You can search by name'
        value={item.label1}
        onChange={(value) => onChange?.({ ...item, label1: value as string })}
      />
    </div>
  );

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPFormList<StandaloneItem>
        id='standalone-example'
        label='Social Links'
        description='Add your social media links (without form context)'
        badgeValue='standalone'
        defaultItem={{ label: '', label1: '' }}
        value={items}
        onChange={setItems}
        renderItem={renderStandaloneItem}
        computeLabel={(item: StandaloneItem, index: number) =>
          item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
        }
      />
      <div className='mt-4 p-4 bg-muted rounded-md'>
        <p className='text-sm text-muted-foreground mb-2'>Current values:</p>
        <pre className='text-xs overflow-auto'>
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const Standalone: StoryObj = {
  render: () => <StandaloneTemplate />,
};

// Standalone version with default values
const WithDefaultValuesStandaloneTemplate = () => {
  const defaultValues: StandaloneItem[] = [
    {
      label: 'Twitter',
      label1: 'user_1',
    },
    {
      label: 'LinkedIn',
      label1: 'user_2',
    },
    {
      label: 'GitHub',
      label1: 'apple',
    },
  ];

  const [items, setItems] = useState<StandaloneItem[]>(defaultValues);

  const renderStandaloneItem = (
    item: StandaloneItem,
    _index: number,
    onChange?: (item: StandaloneItem) => void,
  ) => (
    <div className='grid gap-4'>
      <IGRPInputText
        label='Nome'
        required
        helperText='Insira seu Nome'
        value={item.label}
        onChange={(e) => onChange?.({ ...item, label: e.target.value })}
      />
      <IGRPSelect
        label='Choose an item'
        placeholder='Select one'
        options={mockOptions}
        showSearch={true}
        showGroup={true}
        showStatus={true}
        helperText='You can search by name'
        value={item.label1}
        onValueChange={(value) => onChange?.({ ...item, label1: value })}
      />
    </div>
  );

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPFormList<StandaloneItem>
        id='default-values-standalone-example'
        label='Social Media'
        description='Your social media profiles (pre-filled)'
        badgeValue='pre-filled'
        defaultItem={{ label: '', label1: '' }}
        defaultValue={defaultValues}
        value={items}
        onChange={setItems}
        renderItem={renderStandaloneItem}
        computeLabel={(item: StandaloneItem, index: number) =>
          item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
        }
      />
      <div className='mt-4 p-4 bg-muted rounded-md'>
        <p className='text-sm text-muted-foreground mb-2'>Current values:</p>
        <pre className='text-xs overflow-auto'>
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const StandaloneWithDefaultValues: StoryObj = {
  render: () => <WithDefaultValuesStandaloneTemplate />,
};

// Version with default values loaded (using IGRPForm)
const WithDefaultValuesTemplate = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  const defaultValues: FormValues = {
    socials: [
      {
        label: 'Twitter',
        label1: 'user_1',
      },
      {
        label: 'LinkedIn',
        label1: 'user_2',
      },
      {
        label: 'GitHub',
        label1: 'apple',
      },
    ],
  };

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={defaultValues}
        onSubmit={(data) => console.log('Form submitted:', data)}
      >
        <IGRPFormList
          id='default-values-example'
          name='socials'
          label='Social Media'
          description='Your social media profiles'
          badgeValue='pre-filled'
          defaultItem={defaultItem}
          renderItem={renderItem}
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
          }
        />
      </IGRPForm>
    </div>
  );
};

export const FormListWithDefaultValues: StoryObj = {
  render: () => <WithDefaultValuesTemplate />,
};

// Version with disabled form
const DisabledTemplate = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  const defaultValues: FormValues = {
    socials: [
      {
        label: 'Twitter',
        label1: 'user_1',
      },
      {
        label: 'LinkedIn',
        label1: 'user_2',
      },
    ],
  };

  return (
    <div className='mx-auto px-6 py-8'>
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={defaultValues}
        onSubmit={(data) => console.log('Form submitted:', data)}
        disabled
      >
        <IGRPFormList
          id='disabled-example'
          name='socials'
          label='Social Media'
          description='Your social media profiles (disabled)'
          badgeValue='disabled'
          defaultItem={defaultItem}
          renderItem={renderItem}
          computeLabel={(item: FormValues['socials'][0], index: number) =>
            item.label ? `${item.label} - ${item.label1}` : `Item ${index + 1}`
          }
        />
      </IGRPForm>
    </div>
  );
};

export const FormListDisabled: StoryObj = {
  render: () => <DisabledTemplate />,
};