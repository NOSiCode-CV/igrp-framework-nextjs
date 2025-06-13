import type { Meta, StoryObj } from '@storybook/react';
import {
  IGRPTimeline,
  IGRPTimelineContent,
  IGRPTimelineDate,
  IGRPTimelineHeader,
  IGRPTimelineIndicator,
  IGRPTimelineItem,
  IGRPTimelineSeparator,
  IGRPTimelineTitle,
} from '.';
import { Check, Circle, CheckIcon } from 'lucide-react';

const meta: Meta<typeof IGRPTimeline> = {
  title: 'Components/Timeline',
  component: IGRPTimeline,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
    },
    variant: {
      control: { type: 'radio' },
      options: ['default', 'with-icons'],
    },
    defaultValue: {
      control: { type: 'number' },
    },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPTimeline>;

const items = [
  {
    id: 1,
    date: 'Mar 15, 2024',
    title: 'Project Kickoff',
    description: 'Initial team meeting to discuss project goals and timeline.',
    icon: <Circle className='size-3' />,
  },
  {
    id: 2,
    date: 'Mar 22, 2024',
    title: 'Design Phase',
    description: 'Completed wireframes and design mockups for client review.',
    icon: <Circle className='size-3' />,
  },
  {
    id: 3,
    date: 'Apr 5, 2024',
    title: 'Development Sprint',
    description: 'Backend API development and database setup completed.',
    icon: <Circle className='size-3' />,
  },
  {
    id: 4,
    date: 'Apr 19, 2024',
    title: 'Testing & Deployment',
    description: 'Performance optimization and final QA testing before launch.',
    icon: <Check className='size-3' />,
  },
];

const alternatingItems = [
  {
    id: 1,
    date: 'Mar 15, 2024',
    title: 'Project Kickoff',
  },
  {
    id: 2,
    date: 'Mar 22, 2024',
    title: 'Design Phase',
  },
  {
    id: 3,
    date: 'Apr 5, 2024',
    title: 'Development Sprint',
  },
  {
    id: 4,
    date: 'Apr 19, 2024',
    title: 'Testing & Deployment',
  },
  {
    id: 5,
    date: 'May 3, 2024',
    title: 'User Training',
  },
  {
    id: 6,
    date: 'May 17, 2024',
    title: 'Project Handover',
  },
];

export const Default: Story = {
  render: (args) => (
    <IGRPTimeline {...args}>
      {items.map((item) => (
        <IGRPTimelineItem
          key={item.id}
          step={item.id}
        >
          <IGRPTimelineHeader>
            <IGRPTimelineSeparator />
            <IGRPTimelineDate>{item.date}</IGRPTimelineDate>
            <IGRPTimelineTitle>{item.title}</IGRPTimelineTitle>
            <IGRPTimelineIndicator />
          </IGRPTimelineHeader>
          <IGRPTimelineContent>{item.description}</IGRPTimelineContent>
        </IGRPTimelineItem>
      ))}
    </IGRPTimeline>
  ),
  args: {
    orientation: 'vertical',
    defaultValue: 3,
    variant: 'default',
  },
};

export const WithIcons: Story = {
  render: (args) => (
    <IGRPTimeline {...args}>
      {items.map((item) => (
        <IGRPTimelineItem
          key={item.id}
          step={item.id}
        >
          <IGRPTimelineHeader>
            <IGRPTimelineSeparator />
            <IGRPTimelineDate>{item.date}</IGRPTimelineDate>
            <IGRPTimelineTitle>{item.title}</IGRPTimelineTitle>
            <IGRPTimelineIndicator icon={item.icon} />
          </IGRPTimelineHeader>
          <IGRPTimelineContent>{item.description}</IGRPTimelineContent>
        </IGRPTimelineItem>
      ))}
    </IGRPTimeline>
  ),
  args: {
    orientation: 'vertical',
    defaultValue: 2,
    variant: 'with-icons',
  },
};

export const TimelineContext: Story = {
  render: () => (
    <IGRPTimeline defaultValue={3}>
      {items.map((item) => (
        <IGRPTimelineItem
          key={item.id}
          step={item.id}
          className='group-data-[orientation=vertical]/timeline:ms-10'
        >
          <IGRPTimelineHeader>
            <IGRPTimelineSeparator className='group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5' />
            <IGRPTimelineDate>{item.date}</IGRPTimelineDate>
            <IGRPTimelineTitle>{item.title}</IGRPTimelineTitle>
            <IGRPTimelineIndicator className='group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none group-data-[orientation=vertical]/timeline:-left-7'>
              <CheckIcon
                className='group-not-data-completed/timeline-item:hidden'
                size={16}
              />
            </IGRPTimelineIndicator>
          </IGRPTimelineHeader>
          <IGRPTimelineContent>{item.description}</IGRPTimelineContent>
        </IGRPTimelineItem>
      ))}
    </IGRPTimeline>
  ),
  args: {},
};

export const InteractiveWithIcons: Story = {
  render: (args) => (
    <IGRPTimeline {...args}>
      {items.map((item) => (
        <IGRPTimelineItem
          key={item.id}
          step={item.id}
        >
          <IGRPTimelineHeader>
            <IGRPTimelineSeparator />
            <IGRPTimelineDate>{item.date}</IGRPTimelineDate>
            <IGRPTimelineTitle>{item.title}</IGRPTimelineTitle>
            <IGRPTimelineIndicator icon={item.icon} />
          </IGRPTimelineHeader>
          <IGRPTimelineContent>{item.description}</IGRPTimelineContent>
        </IGRPTimelineItem>
      ))}
    </IGRPTimeline>
  ),
  args: {
    orientation: 'vertical',
    defaultValue: 1,
    variant: 'with-icons',
  },
  parameters: {
    docs: {
      description: {
        story: 'Click on timeline items to see the interactive behavior with icons.',
      },
    },
  },
};

export const AlternatingTimeline: Story = {
  render: (args) => (
    <IGRPTimeline {...args}>
      {alternatingItems.map((item) => (
        <IGRPTimelineItem
          key={item.id}
          step={item.id}
          className='w-[calc(50%-1.5rem)] odd:ms-auto even:text-right even:group-data-[orientation=vertical]/timeline:ms-0 even:group-data-[orientation=vertical]/timeline:me-8 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:translate-x-1/2 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:translate-x-1/2'
        >
          <IGRPTimelineHeader>
            <IGRPTimelineSeparator />
            <IGRPTimelineDate>{item.date}</IGRPTimelineDate>
            <IGRPTimelineTitle>{item.title}</IGRPTimelineTitle>
            <IGRPTimelineIndicator />
          </IGRPTimelineHeader>
        </IGRPTimelineItem>
      ))}
    </IGRPTimeline>
  ),
  args: {
    orientation: 'vertical',
    defaultValue: 3,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Alternating timeline with items on both sides of the line.',
      },
    },
  },
};
