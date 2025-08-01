import type { Meta, StoryObj } from '@storybook/react-vite';
import { IGRPLabel, type IGRPLabelProps } from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPLabel> = {
  title: 'Components/Label',
  component: IGRPLabel,
  argTypes: {
    label: { control: 'text' },
    className: { control: 'text' },
  },
};

export default meta;

const Template = (args: IGRPLabelProps) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPLabel {...args} />
  </div>
);

export const Default: StoryObj<typeof IGRPLabel> = {
  render: Template,
  args: {
    label: 'Text Input',
  },
};
