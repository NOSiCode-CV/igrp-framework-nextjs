import { useState, useRef } from 'react';
import z from 'zod';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPFormList,
  IGRPInputText,
  IGRPSelect,
  IGRPForm,
  type IGRPFormHandle,
  type IGRPOptionsProps,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPFormList> = {
  title: 'Components/FormList',
  component: IGRPFormList,
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

const defaultItem = { label: '', label1: '' };

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
