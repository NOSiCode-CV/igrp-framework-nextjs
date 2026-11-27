import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPStatusBanner,
  IGRPColorObjectRole,
  IGRPColorObjectVariants,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/StatusBanner',
  component: IGRPStatusBanner,
  argTypes: {
    variant: { control: 'select', options: IGRPColorObjectRole },
    color: { control: 'select', options: IGRPColorObjectVariants },
    badgeVariant: { control: 'select', options: IGRPColorObjectRole },
    badgeColor: { control: 'select', options: IGRPColorObjectVariants },
    text: { control: 'text' },
    badgeText: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    text: 'Processo aprovado',
    badgeText: 'Concluído',
  },
} satisfies Meta<typeof IGRPStatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default: soft success alert with an outline badge beside the text. */
export const Default: Story = {};

/** Without `badgeText` the banner shows only the status text. */
export const WithoutBadge: Story = {
  args: { badgeText: undefined },
};

/** Solid alert; the badge uses a soft style so it reads on the filled background. */
export const Solid: Story = {
  args: {
    variant: 'solid',
    color: 'destructive',
    text: 'Pedido rejeitado',
    badgeVariant: 'soft',
    badgeColor: 'secondary',
    badgeText: 'Rejeitado',
  },
};

/** Long text wraps, and the badge moves to the next line instead of overflowing. */
export const LongText: Story = {
  args: {
    color: 'warning',
    text: 'O pedido aguarda a validação de documentos adicionais pelo serviço responsável antes de seguir para aprovação.',
    badgeColor: 'warning',
    badgeText: 'Pendente',
  },
  decorators: [(Story) => <div className="max-w-md"><Story /></div>],
};
