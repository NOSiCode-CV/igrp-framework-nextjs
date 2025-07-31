import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import {
  IGRPInfoCard,
  type IGRPInfoCardProps,
  IGRPColorObjectVariants,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPInfoCard> = {
  title: 'Components/InfoCard',
  component: IGRPInfoCard,
  parameters: {
    docs: {
      description: {
        component:
          'A reusable card component for displaying structured information with sections and optional icons.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The title displayed in the card header',
    },
    sections: {
      control: 'object',
      description: 'Array of sections containing information items',
    },
    variantSection: {
      control: 'select',
      options: IGRPColorObjectVariants,
    },
    // size: {
    //   control: 'select',
    //   options: ['sm', 'default', 'lg', 'xl'],
    // },
    // weight: {
    //   control: 'select',
    //   options: ['light', 'normal', 'medium', 'semibold', 'bold'],
    // },
    // spacing: {
    //   control: 'select',
    //   options: ['tight', 'normal', 'loose', 'none'],
    // },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPInfoCard>;

const Template: StoryFn<IGRPInfoCardProps> = (args: IGRPInfoCardProps) => (
  <div className='container px-6 py-12 mx-auto'>
    <IGRPInfoCard {...args} />
  </div>
);

// Default story with complete taxpayer information
export const Default: Story = {
  render: Template,
  args: {
    title: 'Informações Básicas',
    sections: [
      {
        items: [
          { label: 'NIF', text: '123456789' },
          { label: 'Nome/Razão Social', text: 'João Silva Lda' },
          { label: 'Setor', text: 'Tecnologia', icon: 'Building2' },
        ],
      },
      {
        items: [
          { label: 'Email', text: 'joao@exemplo.com', icon: 'Mail' },
          { label: 'Telefone', text: '+351 912 345 678', icon: 'Phone' },
          { label: 'Endereço', text: 'Rua das Flores, 123, Lisboa', icon: 'MapPin' },
        ],
      },
      {
        items: [{ label: 'Data de Registro', text: '15/03/2024', icon: 'Calendar' }],
      },
    ],
  },
};

// Single section story
export const SingleSection: Story = {
  render: Template,
  args: {
    title: 'Informações Pessoais',
    sections: [
      {
        items: [
          {
            label: 'Nome',
            text: 'Maria Santos',
            icon: 'User',
            variantItem: 'outline',
            colorItem: 'success',
          },
          {
            label: 'Email',
            text: 'maria@exemplo.com',
            icon: 'Mail',
            variantItem: 'soft',
            colorItem: 'destructive',
          },
          {
            label: 'Telefone',
            text: '+351 987 654 321',
            icon: 'Phone',
            variantItem: 'solid',
            colorItem: 'warning',
          },
        ],
      },
    ],
  },
};

// Without icons
export const WithoutIcons: Story = {
  render: Template,
  args: {
    title: 'Dados Simples',
    sections: [
      {
        items: [
          { label: 'Código', text: 'ABC123' },
          { label: 'Descrição', text: 'Produto de exemplo' },
          { label: 'Categoria', text: 'Eletrônicos' },
        ],
      },
      {
        items: [
          { label: 'Preço', text: '€99.99' },
          { label: 'Stock', text: '25 unidades' },
        ],
      },
    ],
  },
};

// Company information
export const CompanyInfo: Story = {
  render: Template,
  args: {
    title: 'Informações da Empresa',
    sections: [
      {
        items: [
          { label: 'Razão Social', text: 'TechCorp Solutions Lda' },
          { label: 'NIPC', text: '987654321' },
          { label: 'Setor', text: 'Consultoria em TI', icon: 'Building2' },
        ],
      },
      {
        items: [
          { label: 'Website', text: 'www.techcorp.pt', icon: 'Globe' },
          { label: 'Email Corporativo', text: 'info@techcorp.pt', icon: 'Mail' },
          { label: 'Telefone Principal', text: '+351 210 123 456', icon: 'Phone' },
        ],
      },
      {
        items: [
          { label: 'Morada', text: 'Av. da Liberdade, 200, Lisboa', icon: 'MapPin' },
          { label: 'Data de Constituição', text: '10/01/2020', icon: 'Calendar' },
        ],
      },
    ],
  },
};

// Financial information
export const FinancialInfo: Story = {
  render: Template,
  args: {
    title: 'Informações Financeiras',
    sections: [
      {
        items: [
          {
            label: 'Número do Cartão',
            text: '**** **** **** 1234',
            icon: 'CreditCard',
            variantItem: 'soft',
            colorItem: 'secondary',
          },
          {
            label: 'Titular',
            text: 'João Silva',
            icon: 'User',
            variantItem: 'soft',
            colorItem: 'indigo',
          },
          { label: 'Validade', text: '12/2027', icon: 'Clock', variantItem: 'soft' },
        ],
      },
      {
        items: [
          { label: 'Limite de Crédito', text: '€5,000.00' },
          { label: 'Saldo Disponível', text: '€3,250.00' },
          { label: 'Última Transação', text: '€45.99 - Supermercado' },
        ],
      },
    ],
  },
};

// Minimal information
export const Minimal: Story = {
  render: Template,
  args: {
    title: 'Resumo',
    sections: [
      {
        items: [
          { label: 'ID', text: '001' },
          { label: 'Status', text: 'Ativo' },
        ],
      },
    ],
  },
};

// Long content
export const LongContent: Story = {
  render: Template,
  args: {
    title: 'Informações Detalhadas',
    sections: [
      {
        items: [
          { label: 'Nome Completo', text: 'João Pedro Silva Santos de Oliveira' },
          {
            label: 'Profissão',
            text: 'Engenheiro de Software Sênior especializado em desenvolvimento web',
          },
          {
            label: 'Empresa',
            text: 'TechCorp Solutions - Consultoria em Tecnologia da Informação Lda',
            icon: 'Building2',
          },
        ],
      },
      {
        items: [
          {
            label: 'Email Principal',
            text: 'joao.pedro.silva.santos@techcorp-solutions.pt',
            icon: 'Mail',
          },
          { label: 'Telefone', text: '+351 912 345 678', icon: 'Phone' },
          {
            label: 'Endereço Completo',
            text: 'Rua das Flores, número 123, 4º andar, apartamento B, 1200-001 Lisboa, Portugal',
            icon: 'MapPin',
          },
        ],
      },
    ],
  },
};

// Custom title
export const CustomTitle: Story = {
  render: Template,
  args: {
    title: 'Perfil do Cliente Premium',
    sections: [
      {
        items: [
          { label: 'Cliente ID', text: 'PREM-2024-001' },
          { label: 'Nome', text: 'Ana Costa', icon: 'User' },
          { label: 'Nível', text: 'Premium Gold' },
        ],
      },
      {
        items: [
          { label: 'Email', text: 'ana.costa@email.com', icon: 'Mail' },
          { label: 'Membro desde', text: '15/06/2020', icon: 'Calendar' },
        ],
      },
    ],
  },
};
