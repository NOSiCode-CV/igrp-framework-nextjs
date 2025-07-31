import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { IGRPAreaChart, type IGRPAreaChartProps } from '@igrp/igrp-framework-react-design-system';

const meta: Meta<IGRPAreaChartProps> = {
  title: 'Components/Charts/Area',
  component: IGRPAreaChart,
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
    stacked: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    expanded: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
  },
};

export default meta;

// Dados de exemplo
const dadosVisitantes = [
  { mes: 'Jan', desktop: 420, mobile: 180, other: 90 },
  { mes: 'Fev', desktop: 520, mobile: 230, other: 110 },
  { mes: 'Mar', desktop: 610, mobile: 310, other: 150 },
  { mes: 'Abr', desktop: 450, mobile: 260, other: 130 },
  { mes: 'Mai', desktop: 480, mobile: 280, other: 140 },
  { mes: 'Jun', desktop: 520, mobile: 290, other: 160 },
];

const dadosReceita = [
  { mes: 'Jan', online: 98500, offline: 67300 },
  { mes: 'Fev', online: 112800, offline: 72400 },
  { mes: 'Mar', online: 135600, offline: 78900 },
  { mes: 'Abr', online: 104500, offline: 71200 },
  { mes: 'Mai', online: 118700, offline: 68400 },
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

const Template: StoryFn<IGRPAreaChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPAreaChart {...args} />
  </div>
);

export const Basico: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    areas: [{ dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' }],
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const AreaChartLinear: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Linear',
    description: 'Linear interpolation',
    data: dadosVisitantes,

    areas: [{ dataKey: 'desktop', name: 'Desktop', color: '#3b82f6', type: 'linear' }],
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const AreaChartStep: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Step',
    description: 'Step visualization of traffic',
    data: dadosVisitantes,
    areas: [{ dataKey: 'desktop', name: 'Desktop', color: '#3b82f6', type: 'step' }],
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const AreaChartStacked: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Stacked',
    description: 'Desktop and mobile user traffic stacked for total volume view',
    data: dadosVisitantes,

    areas: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#8b5cf6' },
    ],
    stacked: true,
    legendPosition: 'bottom',
    categoryKey: 'mes',
    valueFormatter: (value: number) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const AreaChartStackedExpanded: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Stacked Expanded',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    areas: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#8b5cf6' },
      { dataKey: 'other', name: 'Other', color: '#f59e0b' },
    ],
    expanded: true,
    stacked: true,
    legendPosition: 'bottom',
    categoryKey: 'mes',
    valueFormatter: (value) => (typeof value === 'number' ? `${Math.round(value * 100)}%` : value),
    footer: { description: 'January - June 2024' },
  },
};

export const AreaChartLegend: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Legend',
    areas: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#8b5cf6' },
    ],
    legendPosition: 'bottom',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const AreaChartGradient: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Gradient',
    areas: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#8b5cf6' },
    ],
    footer: { description: 'Gradient opacity showing data density' },
    legendPosition: 'bottom',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
  },
};

export const AreaChartAxes: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Axes',
    showGrid: true,
    hideAxis: false,
    valueDomain: [0, 600],
    areas: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#8b5cf6' },
    ],
    legendPosition: 'bottom',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const ReceiveAreas: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Revenue Analysis',
    description: 'Online vs Offline Revenue',
    data: dadosReceita,
    areas: [
      { dataKey: 'online', name: 'Online', color: '#10b981' },
      { dataKey: 'offline', name: 'Offline', color: '#f59e0b' },
    ],
    categoryKey: 'mes',
    valueFormatter: (value: number) => `R$ ${value.toLocaleString()}`,
    legendPosition: 'bottom',
    showGrid: true,
    footer: { description: 'Online revenue has grown consistently' },
  },
};

export const ProductComparison: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Product Performance',
    description: 'Weekly sales by product',
    data: dadosProdutos,
    areas: [
      { dataKey: 'produto1', name: 'Product A', color: '#3b82f6' },
      { dataKey: 'produto2', name: 'Product B', color: '#ec4899' },
      { dataKey: 'produto3', name: 'Product C', color: '#84cc16' },
    ],
    categoryKey: 'semana',
    valueFormatter: (value: number) => `${value} units`,
    legendPosition: 'bottom',
    stacked: true,
    expanded: false,
    showGrid: true,
    footer: { description: 'Product A shows strongest growth trend' },
  },
};

export const SmallSize: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Small',
    description: 'Compact visualization',
    size: 'sm',
    data: dadosVisitantes,
    areas: [{ dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' }],
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};

export const LargeSize: StoryObj<IGRPAreaChartProps> = {
  render: Template,
  args: {
    title: 'Area Chart - Large',
    description: 'Detailed visualization',
    size: 'lg',
    areas: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#8b5cf6' },
    ],
    legendPosition: 'bottom',
    data: dadosVisitantes,
    categoryKey: 'mes',
    valueFormatter: (value) => `${value}`,
    footer: { description: 'January - June 2024' },
  },
};
