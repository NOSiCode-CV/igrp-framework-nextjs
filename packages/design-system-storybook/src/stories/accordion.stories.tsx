import { type IGRPAccordionProps, IGRPAccordion } from '@igrp/igrp-framework-react-design-system';
import type { StoryFn, StoryObj } from '@storybook/nextjs-vite';

export default {
  title: 'Components/Accordion',
  component: IGRPAccordion,
  argTypes: {
    className: { control: 'text' },
    showIcon: { control: 'boolean', default: true },
    iconPlacement: { control: 'select', options: ['left', 'right'], default: 'right' },

    accordionList: {
      control: 'array',
      description: 'Array of accordion items with title and content',
      default: [
        {
          title: 'First Item',
          content: 'This is the content of the first accordion item.',
          iconName: 'Home',
        },
        {
          title: 'Second Item',
          content: 'This is the content of the second accordion item.',
          iconName: 'SpaceIcon',
        },
        {
          title: 'Third Item',
          content: 'This is the content of the third accordion item.',
          iconName: 'Home',
        },
      ],
    },
  },
};

const Template: StoryFn<IGRPAccordionProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
    <IGRPAccordion {...args} />
  </div>
);

export const LeftArrowTrigger: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {
    className: '',
    iconPlacement: 'left',
    showIcon: true,
    accordionList: [
      {
        title: 'First Item',
        content: 'This is the content of the first accordion item.',
      },
      {
        title: 'Second Item',
        content: 'This is the content of the second accordion item.',
      },
      {
        title: 'Third Item',
        content: 'This is the content of the third accordion item.',
      },
    ],
  },
};
export const NoIcon: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {
    className: '',
    iconPlacement: 'right',
    showIcon: false,
    accordionList: [
      {
        title: 'First Item',
        content: 'This is the content of the first accordion item.',
        iconName: 'Home',
      },
      {
        title: 'Second Item',
        content: 'This is the content of the second accordion item.',
        iconName: 'DatabaseZap',
      },
      {
        title: 'Third Item',
        content: 'This is the content of the third accordion item.',
        iconName: 'Aperture',
      },
    ],
  },
};
export const Default: StoryObj<IGRPAccordionProps> = {
  render: Template,
  args: {
    className: '',
    iconPlacement: 'right',
    showIcon: true,
    accordionList: [
      {
        title: 'First Item',
        content: 'This is the content of the first accordion item.',
        iconName: 'Home',
      },
      {
        title: 'Second Item',
        content: 'This is the content of the second accordion item.',
        iconName: 'DatabaseZap',
      },
      {
        title: 'Third Item',
        content: 'This is the content of the third accordion item.',
        iconName: 'Aperture',
      },
    ],
  },
};
