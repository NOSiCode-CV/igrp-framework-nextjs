/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { GitCommitVertical } from 'lucide-react';
import { IGRPLineChart } from '.';
import { type IGRPLineChartProps } from './index';

const meta: Meta<IGRPLineChartProps> = {
  title: 'Components/Charts/Line',
  component: IGRPLineChart,
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
    hideAxis: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    legendPosition: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left', 'none'],
      defaultValue: 'none',
    },
  },
};

export default meta;

const dadosVisitantes = [
  { mes: 'Jan', desktop: 186, mobile: 320 },
  { mes: 'Feb', desktop: 305, mobile: 220 },
  { mes: 'Mar', desktop: 237, mobile: 110 },
  { mes: 'Apr', desktop: 73, mobile: 190 },
  { mes: 'May', desktop: 209, mobile: 230 },
  { mes: 'Jun', desktop: 214, mobile: 270 },
];

const dadosNavegadores = [
  { browser: 'Chrome', users: 620 },
  { browser: 'Safari', users: 480 },
  { browser: 'Firefox', users: 350 },
  { browser: 'Edge', users: 290 },
  { browser: 'Other', users: 150 },
];

const dadosReceita = [
  { mes: 'Jan', online: 98500, offline: 67300 },
  { mes: 'Feb', online: 112800, offline: 72400 },
  { mes: 'Mar', online: 135600, offline: 78900 },
  { mes: 'Apr', online: 104500, offline: 71200 },
  { mes: 'May', online: 118700, offline: 68400 },
  { mes: 'Jun', online: 127300, offline: 72700 },
];

const dadosProdutos = [
  { semana: 'Sem 1', produto1: 120, produto2: 80, produto3: 45 },
  { semana: 'Sem 2', produto1: 145, produto2: 95, produto3: 65 },
  { semana: 'Sem 3', produto1: 160, produto2: 110, produto3: 80 },
  { semana: 'Sem 4', produto1: 137, produto2: 103, produto3: 72 },
  { semana: 'Sem 5', produto1: 152, produto2: 118, produto3: 88 },
  { semana: 'Sem 6', produto1: 176, produto2: 132, produto3: 99 },
];

const Template: StoryFn<IGRPLineChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPLineChart {...args} />
  </div>
);

export const Basico: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
    categoryKey: 'mes',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartLinear: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Linear',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [{ dataKey: 'desktop', color: 'var(--chart-1)', type: 'linear' }],
    categoryKey: 'mes',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartStep: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Step',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [{ dataKey: 'desktop', color: 'var(--chart-1)', type: 'step' }],
    categoryKey: 'mes',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartMultiple: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Multiple',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [
      { dataKey: 'desktop', color: 'var(--chart-1)' },
      { dataKey: 'mobile', color: 'var(--chart-5)' },
    ],
    categoryKey: 'mes',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartDots: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Dots',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [
      {
        dataKey: 'desktop',
        color: 'var(--chart-1)',
        dot: { fill: 'var(--chart-1)', r: 5 },
        activeDot: { r: 7 },
      },
    ],
    categoryKey: 'mes',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartCustomDots: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Custom Dots',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [
      {
        dataKey: 'desktop',
        color: 'var(--chart-1)',
        dot: ({ cx, cy, payload }: any) => {
          const r = 24;
          return (
            <GitCommitVertical
              key={payload.mes}
              x={cx - r / 2}
              y={cy - r / 2}
              width={r}
              height={r}
              fill='hsl(var(--background))'
              stroke='var(--chart-1)'
            />
          );
        },
      },
    ],
    categoryKey: 'mes',
    size: 'lg',
    showGrid: true,
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartDotsColors: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Dots Colors',
    description: 'January - June 2024',
    data: dadosNavegadores,
    lines: [
      {
        dataKey: 'users',
        color: 'var(--chart-5)',
        dot: (props: any) => {
          const colors = [
            'var(--chart-1)',
            'var(--chart-5)',
            'var(--chart-3)',
            'var(--chart-6)',
            'var(--chart-2)',
          ];
          return (
            <circle
              cx={props.cx}
              cy={props.cy}
              r={6}
              fill={colors[props.index]}
              stroke='var(--background)'
              strokeWidth={2}
            />
          );
        },
      },
    ],
    categoryKey: 'browser',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartLabel: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Label',
    description: 'January - June 2024',
    data: dadosVisitantes,
    lines: [
      {
        dataKey: 'desktop',
        color: 'var(--chart-1)',
        showLabels: true,
        labelPosition: 'top',
        labelOffset: 12,
      },
    ],
    categoryKey: 'mes',
    size: 'lg',
    showGrid: true,
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const LineChartCustomLabel: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Line Chart - Custom Label',
    description: 'January - June 2024',
    data: dadosNavegadores,
    lines: [
      {
        dataKey: 'users',
        color: 'var(--chart-5)',
        dot: { fill: 'var(--chart-5)', r: 5 },
        showLabels: true,
        labelPosition: 'right',
        labelOffset: 10,
      },
    ],
    categoryKey: 'browser',
    size: 'lg',
    hideAxis: true,
    footer: { description: 'Showing total visitors for the last 6 months' },
  },
};

export const RevenueLines: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Revenue Analysis',
    description: 'Online vs Offline Revenue',
    data: dadosReceita,
    lines: [
      { dataKey: 'online', name: 'Online', color: 'var(--chart-2)', strokeWidth: 3 },
      { dataKey: 'offline', name: 'Offline', color: 'var(--chart-3)', strokeWidth: 3 },
    ],
    categoryKey: 'mes',
    valueFormatter: (value: number) => `${value.toLocaleString()} CVE`,
    legendPosition: 'bottom',
    showGrid: true,
    footer: { description: 'Online revenue has grown consistently' },
  },
};

export const ProductComparison: StoryObj<IGRPLineChartProps> = {
  render: Template,
  args: {
    title: 'Product Performance',
    description: 'Weekly sales by product',
    data: dadosProdutos,
    lines: [
      { dataKey: 'produto1', name: 'Product A', color: 'var(--chart-1)' },
      { dataKey: 'produto2', name: 'Product B', color: 'var(--chart-5)' },
      { dataKey: 'produto3', name: 'Product C', color: 'var(--chart-3)' },
    ],
    categoryKey: 'semana',
    valueFormatter: (value: number) => `${value} units`,
    legendPosition: 'bottom',
    showGrid: true,
    footer: { description: 'Product A shows strongest growth trend' },
  },
};
