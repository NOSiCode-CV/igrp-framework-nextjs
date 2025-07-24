import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPInputNumber, type IGRPInputNumberProps } from '.';

export default {
  title: 'Components/Input/Number',
  component: IGRPInputNumber,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    description: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    defaultValue: { control: 'number' },
    errorMessage: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputNumberProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputNumber
      {...args}
      onChange={(value) => console.log('Number changed:', value)}
    />
  </div>
);

export const Default: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'quantity',
    label: 'Quantity',
    defaultValue: 0,
  },
};

export const WithMinMax: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'rating',
    label: 'Rating',
    helperText: 'Rate from 0 to 5',
    min: 0,
    max: 5,
    defaultValue: 3,
    step: 1,
  },
};

export const WithHelperText: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'amount',
    label: 'Amount',
    helperText: 'Enter an amount between $0 and $1000',
    defaultValue: 100,
    min: 0,
    max: 1000,
  },
};

export const Currency: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'price',
    label: 'Price',
    defaultValue: 49.99,
    formatOptions: { style: 'currency', currency: 'USD' },
    min: 0,
  },
};

export const Percentage: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'discount',
    label: 'Discount',
    defaultValue: 0.25,
    formatOptions: { style: 'percent' },
    min: 0,
    max: 1,
    step: 0.05,
  },
};

export const WithCustomSteps: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'temperature',
    label: 'Temperature',
    defaultValue: 21,
    min: 16,
    max: 30,
    step: 0.5,
  },
};

export const ReadOnly: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'readOnlyValue',
    label: 'Fixed Value',
    defaultValue: 42,
    readOnly: true,
  },
};

export const Disabled: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'disabledValue',
    label: 'Disabled Input',
    defaultValue: 10,
    disabled: true,
  },
};

export const WithError: StoryObj<IGRPInputNumberProps> = {
  render: Template,
  args: {
    name: 'errorValue',
    label: 'Value with Error',
    defaultValue: 150,
    error: 'Value exceeds maximum allowed',
    min: 0,
    max: 100,
  },
};
