import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { IGRPRadialBarChart } from '.';
import type { IGRPRadialBarChartProps } from '@/components/igrp/chart/types';

const meta: Meta<IGRPRadialBarChartProps> = {
  title: 'Components/Charts/RadialBar',
  component: IGRPRadialBarChart,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'auto'],
      defaultValue: 'md',
    },
    showGrid: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    showBackground: {
      control: { type: 'boolean' },
      defaultValue: true,
    },
    startAngle: {
      control: { type: 'number' },
      defaultValue: 0,
    },
    endAngle: {
      control: { type: 'number' },
      defaultValue: 360,
    },
    legendPosition: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left', 'none'],
      defaultValue: 'none',
    },
  },
};

export default meta;

// Dados de exemplo
const dadosNavegadores = [
  { browser: 'Chrome', visitors: 275 },
  { browser: 'Safari', visitors: 200 },
  { browser: 'Firefox', visitors: 187 },
  { browser: 'Edge', visitors: 173 },
  { browser: 'Other', visitors: 90 },
];

const dadosMensais = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const dadosUnicoNavegador = [{ browser: 'Safari', visitors: 1260 }];

const dadosDesktopMobile = [{ month: 'January', desktop: 1260, mobile: 570 }];

const Template: StoryFn<IGRPRadialBarChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPRadialBarChart {...args} />
  </div>
);

type Story = StoryObj<IGRPRadialBarChartProps>;

export const Basico: Story = {
  render: Template,
  args: {
    title: 'Radial Chart',
    description: 'January - June 2024',
    data: dadosNavegadores,
    bars: [
      {
        dataKey: 'visitors',
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    showBackground: true,
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const RadialChartLabel: Story = {
  render: Template,
  args: {
    title: 'Radial Chart - Label',
    description: 'January - June 2024',
    data: dadosNavegadores,
    bars: [
      {
        dataKey: 'visitors',
        showLabels: true,
        labelPosition: 'insideStart',
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    showBackground: true,
    startAngle: -90,
    endAngle: 380,
    innerRadius: 30,
    outerRadius: 110,
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const RadialChartGrid: Story = {
  render: Template,
  args: {
    title: 'Radial Chart - Grid',
    description: 'January - June 2024',
    data: dadosNavegadores,
    bars: [
      {
        dataKey: 'visitors',
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    showBackground: true,
    showGrid: true,
    gridType: 'circle',
    innerRadius: 30,
    outerRadius: 100,
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const RadialChartText: Story = {
  render: Template,
  args: {
    title: 'Radial Chart - Text',
    description: 'January - June 2024',
    data: dadosNavegadores.slice(0, 1),
    bars: [
      {
        dataKey: 'visitors',
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    showBackground: true,
    centerText: {
      show: true,
      value: 200,
      label: 'Visitors',
    },
    innerRadius: 80,
    outerRadius: 110,
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const RadialChartShape: Story = {
  render: Template,
  args: {
    title: 'Radial Chart - Shape',
    description: 'January - June 2024',
    data: dadosUnicoNavegador,
    bars: [
      {
        dataKey: 'visitors',
        color: 'var(--chart-2)',
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    showBackground: true,
    centerText: {
      show: true,
      value: 1260,
      label: 'Visitors',
    },
    endAngle: 100,
    innerRadius: 80,
    outerRadius: 140,
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const RadialChartStacked: Story = {
  render: Template,
  args: {
    title: 'Radial Chart - Stacked',
    description: 'January - June 2024',
    data: dadosDesktopMobile,
    bars: [
      {
        dataKey: 'desktop',
        name: 'Desktop',
        color: 'var(--chart-1)',
        cornerRadius: 5,
        stackId: 'a',
      },
      {
        dataKey: 'mobile',
        name: 'Mobile',
        color: 'var(--chart-2)',
        cornerRadius: 5,
        stackId: 'a',
      },
    ],
    nameKey: 'month',
    size: 'lg',
    endAngle: 180,
    innerRadius: 80,
    outerRadius: 130,
    centerText: {
      show: true,
      value: 1830,
      label: 'Visitors',
    },
    legendPosition: 'bottom',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const RadialBarsByMonth: Story = {
  render: Template,
  args: {
    title: 'Monthly Stats',
    description: 'Desktop and Mobile Users',
    data: dadosMensais,
    bars: [
      {
        dataKey: 'desktop',
        name: 'Desktop',
        color: 'var(--chart-1)',
      },
    ],
    nameKey: 'month',
    size: 'lg',
    startAngle: 90,
    endAngle: -270,
    innerRadius: 30,
    outerRadius: 140,
    barSize: 10,
    legendPosition: 'bottom',
    footer: {
      description: 'Desktop usage trends over six months',
    },
  },
};

export const RadialBarMultiple: Story = {
  render: Template,
  args: {
    title: 'Browser Comparison',
    description: 'January 2024',
    data: dadosNavegadores,
    bars: [
      {
        dataKey: 'visitors',
        cornerRadius: 6,
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    startAngle: 0,
    endAngle: 180,
    innerRadius: 20,
    outerRadius: 140,
    barSize: 20,
    showBackground: true,
    showGrid: true,
    gridType: 'circle',
    footer: {
      description: 'Browser usage statistics',
    },
  },
};

export const RadialBarProgress: Story = {
  render: Template,
  args: {
    title: 'Completion Status',
    description: 'Project Milestones',
    data: [
      { task: 'Research', progress: 85 },
      { task: 'Design', progress: 65 },
      { task: 'Development', progress: 45 },
      { task: 'Testing', progress: 20 },
      { task: 'Deployment', progress: 10 },
    ],
    bars: [
      {
        dataKey: 'progress',
        showLabels: true,
        labelPosition: 'insideStart',
        labelType: 'name',
      },
    ],
    nameKey: 'task',
    size: 'lg',
    startAngle: 90,
    endAngle: -270,
    innerRadius: 20,
    outerRadius: 160,
    barSize: 20,
    showBackground: true,
    footer: {
      description: 'Project status as of June 2024',
    },
  },
};
