import { useRef } from 'react';
import z from 'zod';
import type { Meta, StoryObj } from '@storybook/react';
import { IGRPFormList } from '.';
import { IGRPInputText, IGRPSelect } from '@/components/igrp/input';
import { IGRPForm, type IGRPFormHandle } from '@/components/igrp/form';
import type { IGRPOptionsProps } from '@/types/globals';

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

// const computeLabel = (item: FormValues['socials'][0], index: number) => (
//   item.label ? item.label1 : `Item ${index + 1}`
// );

const Template = () => {
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  const field = formRef?.current?.watch('socials')
  console.log({ field });

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

export const Basic: StoryObj = {
  render: () => <Template />,
};
