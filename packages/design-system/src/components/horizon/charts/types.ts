/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement, ReactNode } from 'react';

export type IGRPChartDataItem = Record<string, string | number>;
export type IGRPChartSize = 'sm' | 'md' | 'lg' | 'xl' | 'auto';
export type IGRPChartLegendPosition = 'top' | 'right' | 'bottom' | 'left' | 'none';
export type IGRPTooltipIndicator = 'line' | 'dot';

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

export interface IGRPRadarConfig extends IGRPSeriesConfig {
  fill?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  dot?: boolean | object;
  activeDot?: object;
  isAnimationActive?: boolean;
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
