import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPInputHidden } from '.';

export default {
  title: 'Components/Input/Hidden',
  component: IGRPInputHidden,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    iconName: { control: 'text' },
    iconSize: { control: 'number' },
    iconPlacement: {
      control: 'select',
      options: ['start', 'end'],
    },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    className: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<typeof IGRPInputHidden> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputHidden {...args} />
  </div>
);

export const Default: StoryObj<typeof IGRPInputHidden> = {
  render: Template,
  args: {
    name: 'username',
    label: 'Nome de Usuário',
    placeholder: 'Digite seu nome de usuário',
  },
};
