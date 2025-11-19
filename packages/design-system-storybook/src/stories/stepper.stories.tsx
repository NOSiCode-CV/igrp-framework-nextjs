import {
  IGRPStepperProcess,
  type IGRPStepProcessProps,
} from '@igrp/igrp-framework-react-design-system';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const pipelineSteps: IGRPStepProcessProps[] = [
  {
    step: 1,
    stepKey: 'lead',
    title: 'Lead Captured lorem ipsum dolor sit amet',
    isCompleted: true,
    isActive: false,
  },  
  {
    step: 2,
    stepKey: 'lead',
    title: 'Lead Captured lorem ipsum dolor sit amet',
    isCompleted: true,
    isActive: false,
  },  
  {
    step: 3,
    stepKey: 'lead',
    title: 'Lead Captured lorem ipsum dolor sit amet',
    isCompleted: true,
    isActive: false,
  },  
  {
    step: 4,
    stepKey: 'nurturing',
    title: 'Nurturing lorem ipsum dolor sit amet',
    isCompleted: false,
    isActive: true,
  },
  {
    step: 5,
    stepKey: 'legal',
    title: 'Legal Review lorem ipsum dolor sit amet',
    isCompleted: false,
    isActive: false,
  },
  {
    step: 6,
    stepKey: 'closed',
    title: 'Closed Won lorem ipsum dolor sit amet',
    isCompleted: false,
    isActive: false,
  },  
  {
    step: 7,
    stepKey: 'closed',
    title: 'Closed Won lorem ipsum dolor sit amet',
    isCompleted: false,
    isActive: false,
  },  
  {
    step: 8,
    stepKey: 'closed',
    title: 'Closed Won lorem ipsum dolor sit amet',
    isCompleted: false,
    isActive: false,
  },  
] satisfies IGRPStepProcessProps[];

const longJourneySteps: IGRPStepProcessProps[] = [
  {
    step: 1,
    stepKey: 'idea',
    title: 'Idea lorem ipsum dolor sit amet',
    description: 'Product vision defined and initial pitch written.',
    isCompleted: true,
    isActive: false,
  },
  {
    step: 2,
    stepKey: 'discovery',
    title: 'Discovery',
    description: 'Research and interviews with users are ongoing.',
    isCompleted: true,
    isActive: true,
  },
  {
    step: 3,
    stepKey: 'design',
    title: 'Design',
    description: 'Wireframes and clickable prototypes are being created.',
    isCompleted: false,
    isActive: true,
  },
  {
    step: 4,
    stepKey: 'development',
    title: 'Development',
    description: 'MVP build in progress with weekly demos.',
    isCompleted: false,
    isActive: true,
  },
  {
    step: 5,
    stepKey: 'qa',
    title: 'QA & Testing',
    description: 'Regression suite and accessibility audit.',
    isCompleted: false,
    isActive: false,
  },
  {
    step: 6,
    stepKey: 'launch',
    title: 'Launch',
    description: 'Marketing launch plan and release checklist.',
    isCompleted: false,
    isActive: false,
  },
  {
    step: 7,
    stepKey: 'post-launch',
    title: 'Post Launch',
    description: 'Monitoring adoption metrics and gathering feedback.',
    isCompleted: false,
    isActive: false,
  },
  {
    step: 8,
    stepKey: 'post-launch-2',
    title: 'Post Launch',
    description: 'Monitoring adoption metrics and gathering feedback.',
    isCompleted: false,
    isActive: false,
  },
] satisfies IGRPStepProcessProps[];

const meta = {
  title: 'Components/Stepper',
  component: IGRPStepperProcess,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    children: {
      control: false,
    },
    steps: {
      control: false,
    },
  },
} satisfies Meta<typeof IGRPStepperProcess>;

export default meta;
type Story = StoryObj<typeof meta>;

const StepDetails = ({ step, steps }: { step: number; steps: IGRPStepProcessProps[] }) => {
  const current = steps.find((item) => item.step === step);
  if (!current) {
    return null;
  }

  const completedCount = steps.filter((item) => item.isCompleted).length;
  const remainingCount = Math.max(steps.length - completedCount, 0);

  return (
    <div className="rounded-3xl border border-border/60 bg-background p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Current Step</p>
      <h3 className="mt-2 text-2xl font-semibold">{current.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>

      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Completed</p>
          <p className="text-xl font-semibold text-emerald-600">{completedCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Remaining</p>
          <p className="text-xl font-semibold text-blue-600">{remainingCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Status</p>
          <p className="text-xl font-semibold">
            {current.isCompleted ? 'Finished' : current.isActive ? 'In progress' : 'Waiting'}
          </p>
        </div>
      </div>
    </div>
  );
};

const renderStepper = (args: Story['args']) => (
  <div className="space-y-6 px-4 py-8">
    <IGRPStepperProcess {...args}>
      {(step) => <StepDetails step={step} steps={args!.steps ?? pipelineSteps} />}
    </IGRPStepperProcess>
  </div>
);

export const Default: Story = {
  args: {
    steps: pipelineSteps,
    currentStep: 4,
    isLoading: false,
    children: (step: number) => <StepDetails step={step} steps={pipelineSteps} />,
  },
  render: (args) => renderStepper(args),
};

export const LoadingState: Story = {
  args: {
    steps: pipelineSteps,
    currentStep: 4,
    isLoading: true,
    children: (step: number) => <StepDetails step={step} steps={pipelineSteps} />,
  },
  render: (args) => renderStepper(args),
};

export const LongJourney: Story = {
  args: {
    steps: longJourneySteps,
    currentStep: 3,
    isLoading: false,
    children: (step: number) => <StepDetails step={step} steps={longJourneySteps} />,
  },
  render: (args) => renderStepper(args),
};

