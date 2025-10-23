/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement, ReactNode } from 'react';

export type IGRPChartDataItem = Record<string, string | number>;
export type IGRPChartSize = 'sm' | 'md' | 'lg' | 'xl' | 'auto';
export type IGRPChartLegendPosition = 'top' | 'right' | 'bottom' | 'left' | 'none';
export type IGRPTooltipIndicator = 'line' | 'dot';

export const IGRP_CHART_COLORS = [
  'var(--chart-1)', // Azul (equivalente ao #3b82f6)
  'var(--chart-2)', // Verde (equivalente ao #10b981)
  'var(--chart-3)', // Laranja (equivalente ao #f59e0b)
  'var(--chart-4)', // Roxo (equivalente ao #6366f1)
  'var(--chart-5)', // Rosa (equivalente ao #ec4899)
  'var(--chart-6)', // Violeta (equivalente ao #8b5cf6)
  'var(--chart-7)', // Vermelho (equivalente ao #ef4444)
  'var(--chart-8)', // Lima (equivalente ao #84cc16)
];

export interface IGRPSeriesConfig {
  dataKey: string;
  name?: string;
  color?: string;
  stackId?: string;
  render?: (props: any) => React.ReactNode;
}

export interface IGRPAreaConfig extends IGRPSeriesConfig {
  type?: 'linear' | 'monotone' | 'step' | 'basis' | 'natural';
  fillOpacity?: number;
  gradient?: boolean;
}

export interface IGRPBarConfig extends IGRPSeriesConfig {
  radius?: number;
}

export interface IGRPChartFooter {
  description?: string;
}

export interface IGRPChartProps {
  data: IGRPChartDataItem[];
  categoryKey: string;
  title?: string;
  description?: string;
  showGrid?: boolean;
  legendPosition?: IGRPChartLegendPosition;
  customLegend?: ReactElement | ((props: any) => ReactNode);
  showTooltip?: boolean;
  hideAxis?: boolean;
  hideXAxis?: boolean;
  hideYAxis?: boolean;
  showReferenceZero?: boolean;
  valueDomain?: [number, number];
  size?: IGRPChartSize;
  height?: number | string;
  width?: number | string;
  stacked?: boolean;
  className?: string;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: string) => string;
  gridColor?: string;
  backgroundColor?: string;
  referenceLineColor?: string;
  axisColor?: string;
  tooltipIndicator?: IGRPTooltipIndicator;
  footer?: IGRPChartFooter;
}

export interface IGRPAreaChartProps extends IGRPChartProps {
  areas: IGRPAreaConfig[];
  expanded?: boolean;
}

export interface IGRPVerticalBarChartProps extends IGRPChartProps {
  bars: IGRPBarConfig[];
  barRadius?: number;
  barGap?: number;
  barCategoryGap?: string | number;
  showXAxis?: boolean;
}

export interface IGRPHorizontalBarChartProps extends IGRPChartProps {
  bars: IGRPBarConfig[];
  barRadius?: number;
  barGap?: number;
  barCategoryGap?: string | number;
}

export interface PieConfig extends IGRPSeriesConfig {
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  cornerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  cx?: number | string;
  cy?: number | string;
  showLabels?: boolean;
  labelType?: 'value' | 'name' | 'percent';
  labelPosition?: 'inside' | 'outside' | 'insideLeft' | 'insideRight' | 'center';
  labelLine?: boolean;
  activeIndex?: number;
  activeShape?: boolean;
}

export interface IGRPPieChartProps extends IGRPChartProps {
  pies: PieConfig[];
  nameKey: string;
  centerLabel?: {
    show: boolean;
    text?: string;
  };
  interactive?: boolean;
}

export interface IGRPRadarConfig extends IGRPSeriesConfig {
  fill?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  dot?: boolean | object;
  activeDot?: object;
  isAnimationActive?: boolean;
}

export interface IGRPRadarChartProps extends IGRPChartProps {
  radars: IGRPRadarConfig[];
  angleAxisKey: string;
  polarGridType?: 'polygon' | 'circle';
  polarGridLineType?: 'solid' | 'dashed' | 'dotted';
  showPolarGrid?: boolean;
  showRadiusAxis?: boolean;
  radiusAxisDomain?: [number | string, number | string];
  radiusAxisAngle?: number;
  customAngleAxisTick?: any;
  showGridLines?: boolean;
  showRadiusLines?: boolean;
  gridFilled?: boolean;
}

export interface RadialBarConfig extends IGRPSeriesConfig {
  cornerRadius?: number;
  minAngle?: number;
  background?: boolean;
  clockWise?: boolean;
  stackId?: string;
  showLabels?: boolean;
  labelType?: 'value' | 'name' | 'percent';
  labelPosition?: 'inside' | 'outside' | 'insideStart' | 'insideEnd';
  labelStyle?: React.CSSProperties;
}

export interface IGRPRadialBarChartProps extends IGRPChartProps {
  bars: RadialBarConfig[];
  nameKey: string;
  startAngle?: number;
  endAngle?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  barSize?: number;
  showGrid?: boolean;
  gridType?: 'polygon' | 'circle';
  showBackground?: boolean;
  showRadiusAxis?: boolean;
  centerText?: {
    show: boolean;
    value?: string | number;
    label?: string;
    formatter?: (value: number) => string;
  };
}
