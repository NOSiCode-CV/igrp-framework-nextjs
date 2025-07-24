import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPPieChart } from '.';
import { type IGRPPieChartProps } from '@/components/igrp/chart/types';

const meta: Meta<IGRPPieChartProps> = {
  title: 'Components/Charts/Pie',
  component: IGRPPieChart,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'auto'],
      defaultValue: 'md',
    },
    showTooltip: {
      control: { type: 'boolean' },
      defaultValue: true,
    },
    legendPosition: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left', 'none'],
      defaultValue: 'none',
    },
    interactive: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
  },
};

export default meta;

// Dados de exemplo
const dadosNavegadores = [
  { browser: 'Chrome', users: 275 },
  { browser: 'Safari', users: 200 },
  { browser: 'Firefox', users: 187 },
  { browser: 'Edge', users: 173 },
  { browser: 'Other', users: 90 },
];

const dadosMeses = [
  { mes: 'Jan', valor: 186 },
  { mes: 'Fev', valor: 305 },
  { mes: 'Mar', valor: 237 },
  { mes: 'Abr', valor: 173 },
  { mes: 'Mai', valor: 209 },
];

const Template: StoryFn<IGRPPieChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPPieChart {...args} />
  </div>
);

export const Basico: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [{ dataKey: 'users' }],
    nameKey: 'browser',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartSeparatorNone: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Separator None',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [{ dataKey: 'users', paddingAngle: 0, cornerRadius: 0 }],
    nameKey: 'browser',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartLabel: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Label',
    description: 'January - June 2024',
    data: dadosMeses,
    pies: [
      {
        dataKey: 'valor',
        showLabels: true,
        labelType: 'value',
        labelPosition: 'inside',
      },
    ],
    nameKey: 'mes',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartCustomLabel: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Custom Label',
    description: 'January - June 2024',
    data: dadosMeses,
    pies: [
      {
        dataKey: 'valor',
        showLabels: true,
        labelType: 'value',
        labelPosition: 'inside',
        labelLine: false,
      },
    ],
    nameKey: 'mes',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartLabelList: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Label List',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [
      {
        dataKey: 'users',
        showLabels: true,
        labelType: 'name',
        labelPosition: 'outside',
        labelLine: true,
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartWithLegend: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Legend',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [{ dataKey: 'users' }],
    nameKey: 'browser',
    size: 'lg',
    legendPosition: 'bottom',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartDonut: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Donut',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [{ dataKey: 'users', innerRadius: 60 }],
    nameKey: 'browser',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartDonutActive: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Donut Active',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [
      {
        dataKey: 'users',
        innerRadius: 60,
        activeIndex: 0,
        activeShape: true,
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartDonutWithText: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Donut with Text',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [{ dataKey: 'users', innerRadius: 60 }],
    nameKey: 'browser',
    size: 'lg',
    centerLabel: {
      show: true,
      text: 'Visitors',
    },
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartStacked: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Stacked',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [
      { dataKey: 'users', innerRadius: 70, outerRadius: 90 },
      { dataKey: 'users', innerRadius: 0, outerRadius: 60 },
    ],
    nameKey: 'browser',
    size: 'lg',
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};

export const PieChartInteractive: StoryObj<IGRPPieChartProps> = {
  render: Template,
  args: {
    title: 'Pie Chart - Interactive',
    description: 'January - June 2024',
    data: dadosNavegadores,
    pies: [
      {
        dataKey: 'users',
        innerRadius: 60,
        activeShape: true,
      },
    ],
    nameKey: 'browser',
    size: 'lg',
    interactive: true,
    centerLabel: {
      show: true,
      text: 'Visitors',
    },
    footer: {
      description: 'Showing total visitors for the last 6 months',
    },
  },
};
