import { type IGRPAccordionProps, IGRPAccordion, IGRPButton } from '@igrp/igrp-framework-react-design-system';
import type { StoryFn, StoryObj } from '@storybook/nextjs-vite';

export default {
  title: 'Components/Accordion',
  component: IGRPAccordion,
  argTypes: {
    className: { control: 'text' },
    showIcon: {
      control: 'boolean',
      default: true
    },
    iconPlacement: {
      control: 'select',
      options: ['start', 'end'],
      default: 'end'
    },
  },
};

const items_examples = [
  {
    title: 'First Item',
    content: 'This is the content of the first accordion item.',
    iconName: 'Minus'
  },
  {
    title: 'Second Item',
    content: 'This is the content of the second accordion item.',
    showIcon: false
  },
  {
    title: 'Third Item',
    content: 'This is the content of the third accordion item.',
  },
]

const Template: StoryFn<IGRPAccordionProps> = (args) => (
  <div className='container my-10 mx-auto p-4'>
    <IGRPAccordion {...args} />
  </div>
);

export const Default: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {        
    iconPlacement: 'end',
    items: items_examples,
    iconName: 'Minus'
  },
};

export const LeftArrowTrigger: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {    
    iconPlacement: 'start',
    items: items_examples
  },
};
export const NoIcon: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {
    iconPlacement: 'end',
    showIcon: false,
    items: items_examples
  },
};

export const SummarySections: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {
    type: 'multiple',
    defaultValue: 'all',
    items: [
      { title: 'Identificação', badgeIcon: 'IdCard', badgeColor: 'success', content: 'Dados de identificação.' },
      { title: 'Subcategorias', badgeIcon: 'Layers', count: 3, content: 'Três subcategorias.' },
      { title: 'Escalões', badgeIcon: 'Layers', count: 0, emptyIcon: 'Inbox', emptyLabel: 'Sem escalões definidos.', content: null },
      {
        title: 'Campos',
        badgeIcon: 'Settings',
        count: 5,
        content: 'Cinco campos.',
        action: <IGRPButton size='sm' variant='ghost'>Editar</IGRPButton>,
      },
    ],
  },
};
