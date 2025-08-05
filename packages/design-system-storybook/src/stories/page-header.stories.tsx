import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPPageHeader, type IGRPPageHeaderProps } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/PageHeader',
  component: IGRPPageHeader,
} satisfies Meta<typeof IGRPPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const data: IGRPPageHeaderProps = {
  title: 'Gestão de Benefícios',
  description:
    'Gerencie e monitore todos os benefícios oferecidos pelo sistema de segurança social.',
};

export const Default: Story = {
  args: { ...data },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};
