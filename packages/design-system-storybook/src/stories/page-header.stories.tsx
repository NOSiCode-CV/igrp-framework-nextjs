import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPPageHeader, type IGRPPageHeaderProps, IGRPButton } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/PageHeader',
  component: IGRPPageHeader,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof IGRPPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseData: IGRPPageHeaderProps = {
  title: 'Gestão de Benefícios',
  description:
    'Gerencie e monitore todos os benefícios oferecidos pelo sistema de segurança social.',
};

// ─── Basic Stories ─────────────────────────────────────────────────────────

export const Default: Story = {
  args: { ...baseData },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

export const WithDescription: Story = {
  args: {
    ...baseData,
    title: 'Dashboard',
    description: 'Visão geral do sistema e métricas principais',
  },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

export const WithoutDescription: Story = {
  args: {
    title: 'Configurações',
  },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

// ─── Back Button Stories ────────────────────────────────────────────────────

export const WithBackButton: Story = {
  args: {
    ...baseData,
    showBackButton: true,
    urlBackButton: '/dashboard',
  },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

export const WithBackButtonCustomIcon: Story = {
  args: {
    ...baseData,
    showBackButton: true,
    urlBackButton: '/dashboard',
    iconBackButton: 'ChevronLeft',
  },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

export const WithBackButtonBrowserBack: Story = {
  args: {
    ...baseData,
    showBackButton: true,
    backButtonUseBrowserBack: true,
  } as IGRPPageHeaderProps,
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

export const WithBackButtonText: Story = {
  args: {
    ...baseData,
    showBackButton: true,
    urlBackButton: '/dashboard',
    backButtonShowText: true,
    backButtonText: 'Voltar',
  } as IGRPPageHeaderProps,
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args} />
    </div>
  ),
};

export const WithBackButtonVariants: Story = {
  args: { title: 'Page Title' },
  render: () => (
    <div className='container mx-auto px-4 py-10 space-y-8'>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Outline (default)</h3>
        <IGRPPageHeader
          title='Page Title'
          showBackButton
          urlBackButton='/dashboard'
          {...({ backButtonVariant: 'outline' } as any)}
        />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Ghost</h3>
        <IGRPPageHeader
          title='Page Title'
          showBackButton
          urlBackButton='/dashboard'
          {...({ backButtonVariant: 'ghost' } as any)}
        />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Secondary</h3>
        <IGRPPageHeader
          title='Page Title'
          showBackButton
          urlBackButton='/dashboard'
          {...({ backButtonVariant: 'secondary' } as any)}
        />
      </div>
    </div>
  ),
};

export const WithBackButtonSizes: Story = {
  args: { title: 'Page Title' },
  render: () => (
    <div className='container mx-auto px-4 py-10 space-y-8'>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Icon (default)</h3>
        <IGRPPageHeader
          title='Page Title'
          showBackButton
          urlBackButton='/dashboard'
          {...({ backButtonSize: 'icon' } as any)}
        />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Icon Small</h3>
        <IGRPPageHeader
          title='Page Title'
          showBackButton
          urlBackButton='/dashboard'
          {...({ backButtonSize: 'icon-sm' } as any)}
        />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Icon Large</h3>
        <IGRPPageHeader
          title='Page Title'
          showBackButton
          urlBackButton='/dashboard'
          {...({ backButtonSize: 'icon-lg' } as any)}
        />
      </div>
    </div>
  ),
};

export const WithBackButtonCustomHandler: Story = {
  args: { title: 'Page Title' },
  render: () => {
    const handleCustomBack = () => {
      alert('Custom back handler triggered!');
    };

    return (
      <div className='container mx-auto px-4 py-10'>
        <IGRPPageHeader
          title='Page Title'
          description='With custom onClick handler'
          showBackButton
          {...({ backButtonOnClick: handleCustomBack } as any)}
        />
      </div>
    );
  },
};

// ─── Layout Stories ───────────────────────────────────────────────────────

export const WithActions: Story = {
  args: {
    ...baseData,
    showBackButton: true,
    urlBackButton: '/dashboard',
  },
  render: (args) => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader {...args}>
        <div className='flex gap-2'>
          <IGRPButton variant='outline'>Cancelar</IGRPButton>
          <IGRPButton>Salvar</IGRPButton>
        </div>
      </IGRPPageHeader>
    </div>
  ),
};

export const Sticky: Story = {
  args: {
    ...baseData,
    showBackButton: true,
    urlBackButton: '/dashboard',
    isSticky: true,
  },
  render: (args) => (
    <div className='container mx-auto px-4'>
      <IGRPPageHeader {...args}>
        <IGRPButton>Action</IGRPButton>
      </IGRPPageHeader>
      <div className='h-screen py-10'>
        <p className='text-muted-foreground'>
          Scroll down to see the sticky header behavior. The header will remain
          fixed at the top when scrolling.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i} className='py-4'>
            Content section {i + 1}
          </p>
        ))}
      </div>
    </div>
  ),
};

// ─── Variant Stories ───────────────────────────────────────────────────────

export const HeadlineVariants: Story = {
  args: { title: 'Page Title' },
  render: () => (
    <div className='container mx-auto px-4 py-10 space-y-8'>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>Default</h3>
        <IGRPPageHeader title='Page Title' description='Default variant' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>H1</h3>
        <IGRPPageHeader title='Page Title' description='H1 variant' variant='h1' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>H2</h3>
        <IGRPPageHeader title='Page Title' description='H2 variant' variant='h2' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-4 text-muted-foreground'>H3</h3>
        <IGRPPageHeader title='Page Title' description='H3 variant' variant='h3' />
      </div>
    </div>
  ),
};

// ─── Complete Example ──────────────────────────────────────────────────────

export const CompleteExample: Story = {
  args: { title: 'Gestão de Benefícios' },
  render: () => (
    <div className='container mx-auto px-4 py-10'>
      <IGRPPageHeader
        title='Gestão de Benefícios'
        description='Gerencie e monitore todos os benefícios oferecidos pelo sistema de segurança social.'
        showBackButton
        urlBackButton='/dashboard'
        iconBackButton='ArrowLeft'
        {...({
          backButtonShowText: true,
          backButtonText: 'Voltar ao Dashboard',
          backButtonVariant: 'outline',
        } as any)}
        isSticky
      >
        <div className='flex gap-2'>
          <IGRPButton variant='outline'>Exportar</IGRPButton>
          <IGRPButton>Novo Benefício</IGRPButton>
        </div>
      </IGRPPageHeader>
      <div className='mt-8'>
        <p className='text-muted-foreground'>
          This is a complete example showing all features: back button with text,
          custom icon, actions, and sticky positioning.
        </p>
      </div>
    </div>
  ),
};
