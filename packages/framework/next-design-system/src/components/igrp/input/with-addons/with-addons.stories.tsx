import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPInputAddOn, type IGRPInputAddOnProps } from '.';

export default {
  title: 'Components/Input/With Addons',
  component: IGRPInputAddOn,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    optionLabel: { control: 'text' },
    options: { control: 'object' },
    classNameGlobal: { control: 'text' },
    classNameLabel: { control: 'text' },
    classNameInput: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputAddOnProps> = (args) => {
  const [selected, setSelected] = useState(args.selectValue || '');

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
      <IGRPInputAddOn
        {...args}
        selectValue={selected}
        onSelectValueChange={setSelected}
      />
    </div>
  );
};

export const Default: StoryObj<IGRPInputAddOnProps> = {
  render: Template,
  args: {
    label: 'Select an option',
    optionLabel: 'Available Options',
    options: [
      { value: 'option1', label: 'Option 11111', color: 'text-blue-500' },
      { value: 'option2', label: 'Option 2', color: 'text-green-500' },
      { value: 'option3', label: 'Option 3', color: 'text-red-500' },
    ],
    placeholder: 'Enter text...',
  },
};

export const WithoutOptionLabel: StoryObj<IGRPInputAddOnProps> = {
  render: Template,
  args: {
    label: 'Choose an item',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
    placeholder: 'Start typing...',
  },
};
