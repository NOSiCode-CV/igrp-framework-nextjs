import z from 'zod';
import { useRef, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import {
  IGRPSelect,
  type IGRPOptionsProps,
  Button,
  IGRPForm,
  type IGRPFormHandle,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPSelect> = {
  title: 'Components/Input/Select',
  component: IGRPSelect,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof IGRPSelect>;

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

const Template: React.FC<Partial<React.ComponentProps<typeof IGRPSelect>>> = (args) => {
  const schema = z.object({
    fruit: z.string(),
  });
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => alert(JSON.stringify(data));

  return (
    <>
      <IGRPForm
        schema={schema}
        onSubmit={onSubmit}
        formRef={formRef}
        gridClassName='space-y-4 w-80'
      >
        <IGRPSelect
          name='fruit'
          label='Choose an item'
          placeholder='Select one'
          options={mockOptions}
          showSearch={true}
          showGroup={true}
          showStatus={true}
          helperText='You can search by name'
          {...args}
        />
      </IGRPForm>

      <Button
        type='submit'
        onClick={() => formRef.current?.submit()}
      >
        Submit
      </Button>
    </>
  );
};

export const Default: Story = {
  args: {
    options: mockOptions,
    // label: 'Choose an item',
    showGroup: true,
    showSearch: true,
    showStatus: true,
  },
};

export const DefaultWithForm: Story = {
  render: () => <Template />,
};

export const WithError: Story = {
  render: () => <Template error='This field is required' />,
};

export const Disabled: Story = {
  render: () => <Template disabled />,
};

/**
 * Regression story: the SelectTrigger (combobox button) must carry
 * aria-invalid="true" and an aria-describedby pointing at the error message
 * when the field has a validation error.
 *
 * NOTE: test:vitest runner is currently broken in this environment (pre-existing
 * "Failed to initialize projects" issue). Build gate: `pnpm build:ds`.
 */
const SelectErrorA11yTemplate: React.FC = () => {
  const schema = z.object({ fruit: z.string().min(1, 'This field is required') });
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  useEffect(() => {
    // Force the error immediately so the play function can query it synchronously.
    formRef.current?.setError('fruit', { message: 'This field is required' });
  }, []);

  return (
    <IGRPForm
      schema={schema}
      onSubmit={() => {}}
      formRef={formRef}
      gridClassName='space-y-4 w-80'
    >
      <IGRPSelect
        name='fruit'
        label='Fruit'
        placeholder='Select one'
        options={mockOptions}
        required
      />
    </IGRPForm>
  );
};

export const SelectErrorA11y: Story = {
  name: 'SelectErrorA11y',
  render: () => <SelectErrorA11yTemplate />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger carries aria-invalid when field has an error', async () => {
      const trigger = canvas.getByRole('combobox');
      expect(trigger.getAttribute('aria-invalid')).toBe('true');
    });

    await step('trigger aria-describedby resolves to the error message element', async () => {
      const trigger = canvas.getByRole('combobox');
      const describedById = trigger.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      const messageEl = document.getElementById(describedById!);
      expect(messageEl).not.toBeNull();
      expect(messageEl?.textContent).toMatch(/required/i);
    });
  },
};
