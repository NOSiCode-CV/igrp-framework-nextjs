import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPButtonLink,
  IGRPIconObject,
  IGRPTooltipProvider,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/ButtonLink',
  component: IGRPButtonLink,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    iconName: { control: 'select', options: IGRPIconObject },
    iconPlacement: { control: 'select', options: ['start', 'end'] },
    disabled: { control: 'boolean' },
    showPendingIndicator: { control: 'boolean' },
    tooltip: { control: 'text' },
  },
} satisfies Meta<typeof IGRPButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { href: '/processos', label: 'Abrir', iconName: 'Eye' },
};

export const IconOnly: Story = {
  args: { href: '/processos', size: 'icon', label: 'Editar', iconName: 'Pencil' },
};

export const DisabledWithTooltip: Story = {
  args: {
    href: '/processos',
    disabled: true,
    size: 'icon',
    label: 'Sem permissão',
    iconName: 'Lock',
  },
};

export const InTooltipProvider: Story = {
  args: { href: '/processos' },
  render: () => (
    <IGRPTooltipProvider>
      <div className='p-4 flex gap-2'>
        <IGRPButtonLink
          href='/processos'
          size='icon'
          label='Ver'
          iconName='Eye'
        />
        <IGRPButtonLink
          href='/processos'
          size='icon'
          label='Editar'
          iconName='Pencil'
        />
        <IGRPButtonLink
          href='/processos'
          size='icon'
          label='Eliminar'
          iconName='Trash2'
          variant='destructive'
        />
      </div>
    </IGRPTooltipProvider>
  ),
};
