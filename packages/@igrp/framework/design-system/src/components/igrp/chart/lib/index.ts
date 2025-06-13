import {
  IGRP_CHART_COLORS,
  type IGRPChartDataItem,
  type IGRPChartLegendPosition,
  type IGRPChartSize,
  type IGRPSeriesConfig,
} from '../types';
import type { ChartConfig as ShadCNChartConfig } from '@/components/primitives/chart';

export const formatChartValue = (
  value: number,
  valueFormatter?: (value: number) => string,
): string => {
  if (valueFormatter) {
    return valueFormatter(value);
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const getChartHeight = (
  size: IGRPChartSize,
  data: IGRPChartDataItem[] = [],
  height?: number | string,
): number | string => {
  if (height) return typeof height === 'number' ? height : height;

  const baseHeight = 40;
  const headerHeight = 30;
  const calculatedHeight = data.length * baseHeight + headerHeight;

  const minHeight =
    size === 'sm' ? 200 : size === 'md' ? 280 : size === 'lg' ? 400 : size === 'xl' ? 500 : 280;

  return Math.max(calculatedHeight, minHeight);
};

export const getChartWidth = (width?: number | string): number | string => {
  if (width) return typeof width === 'number' ? width : width;
  return '100%';
};

export const getLegendLayout = (legendPosition: IGRPChartLegendPosition) => {
  return legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal';
};

export const getLegendVerticalAlign = (legendPosition: IGRPChartLegendPosition) => {
  return legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle';
};

export const getLegendHorizontalAlign = (legendPosition: IGRPChartLegendPosition) => {
  return legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center';
};

export const hasNegativeValues = (data: IGRPChartDataItem[], dataKeys: string[]): boolean => {
  return data.some((item) => {
    return dataKeys.some((key) => {
      const value = item[key];
      return typeof value === 'number' && value < 0;
    });
  });
};

export const createChartConfig = (series: IGRPSeriesConfig[]): ShadCNChartConfig => {
  const config = {} as ShadCNChartConfig;

  series.forEach((item, index) => {
    config[item.dataKey] = {
      label: item.name || item.dataKey,
      color: item.color || IGRP_CHART_COLORS[index % IGRP_CHART_COLORS.length],
    };
  });

  return config;
};
