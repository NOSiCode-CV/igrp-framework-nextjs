import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPRadarChart, type IGRPRadarChartProps } from '@igrp/igrp-framework-react-design-system';

const meta: Meta<IGRPRadarChartProps> = {
  title: 'Components/Charts/Radar',
  component: IGRPRadarChart,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'auto'],
      defaultValue: 'md',
    },
    showPolarGrid: {
      control: { type: 'boolean' },
      defaultValue: true,
    },
    polarGridType: {
      control: { type: 'select' },
      options: ['polygon', 'circle'],
      defaultValue: 'polygon',
    },
    showRadiusAxis: {
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

// Dados de exemplo
const dadosVisitantes = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const dadosDesempenho = [
  { category: 'Speed', current: 90, previous: 65 },
  { category: 'Reliability', current: 85, previous: 70 },
  { category: 'Comfort', current: 75, previous: 60 },
  { category: 'Safety', current: 95, previous: 80 },
  { category: 'Efficiency', current: 70, previous: 55 },
  { category: 'Design', current: 85, previous: 75 },
];

const Template: StoryFn<IGRPRadarChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPRadarChart {...args} />
  </div>
);

export const Basico: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
    angleAxisKey: 'month',
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartDots: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Dots',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [
      {
        dataKey: 'desktop',
        color: 'var(--chart-1)',
        dot: true,
      },
    ],
    angleAxisKey: 'month',
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartMultiple: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Multiple',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [
      { dataKey: 'desktop', color: 'var(--chart-1)' },
      { dataKey: 'mobile', color: 'var(--chart-2)' },
    ],
    angleAxisKey: 'month',
    size: 'lg',
    legendPosition: 'bottom',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartLinesOnly: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Lines Only',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [
      { dataKey: 'desktop', color: 'var(--chart-1)', fillOpacity: 0 },
      { dataKey: 'mobile', color: 'var(--chart-2)', fillOpacity: 0 },
    ],
    angleAxisKey: 'month',
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartCustomLabel: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Custom Label',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [
      { dataKey: 'desktop', color: 'var(--chart-1)' },
      { dataKey: 'mobile', color: 'var(--chart-2)' },
    ],
    angleAxisKey: 'month',
    size: 'lg',
    customAngleAxisTick: ({
      x,
      y,
      textAnchor,
      index,
    }: {
      x: number;
      y: number;
      textAnchor: string;
      index: number;
    }) => {
      const data = dadosVisitantes[index];
      return (
        <text
          x={x}
          y={index === 0 ? y - 10 : y}
          textAnchor={textAnchor}
          fontSize={13}
          fontWeight={500}
          className='fill-foreground'
        >
          <tspan>{data.desktop}</tspan>
          <tspan className='fill-muted-foreground'>/</tspan>
          <tspan>{data.mobile}</tspan>
          <tspan
            x={x}
            dy={'1rem'}
            fontSize={12}
            className='fill-muted-foreground'
          >
            {data.month}
          </tspan>
        </text>
      );
    },
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartRadiusAxis: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Radius Axis',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
    angleAxisKey: 'month',
    showRadiusAxis: true,
    radiusAxisDomain: [0, 400],
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartGridCustom: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Grid Custom',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
    angleAxisKey: 'month',
    polarGridLineType: 'dashed',
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartGridFilled: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Grid Filled',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
    angleAxisKey: 'month',
    gridFilled: true,
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartGridNone: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Grid None',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)', dot: true }],
    angleAxisKey: 'month',
    showPolarGrid: false,
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartGridCircle: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Grid Circle',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)', dot: true }],
    angleAxisKey: 'month',
    polarGridType: 'circle',
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartGridCircleNoLines: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Grid Circle - No lines',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)', dot: true }],
    angleAxisKey: 'month',
    polarGridType: 'circle',
    showRadiusLines: false,
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const RadarChartGridCircleFilled: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Radar Chart - Grid Circle Filled',
    description: 'Showing total visitors for the last 6 months',
    data: dadosVisitantes,
    radars: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
    angleAxisKey: 'month',
    polarGridType: 'circle',
    gridFilled: true,
    size: 'lg',
    footer: {
      description: 'January - June 2024',
    },
  },
};

export const PerformanceComparison: StoryObj<IGRPRadarChartProps> = {
  render: Template,
  args: {
    title: 'Performance Comparison',
    description: 'Current vs Previous Model',
    data: dadosDesempenho,
    radars: [
      { dataKey: 'current', name: 'Current Model', color: 'var(--chart-1)' },
      { dataKey: 'previous', name: 'Previous Model', color: 'var(--chart-5)' },
    ],
    angleAxisKey: 'category',
    size: 'lg',
    legendPosition: 'bottom',
    valueFormatter: (value) => `${value}%`,
    footer: {
      description: 'Showing overall performance metrics',
    },
  },
};
