/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { cn } from '../../../lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '../../primitives/chart';
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
} from './lib';
import { type IGRPChartProps, type IGRPRadarConfig } from './types';

interface IGRPRadarChartProps extends IGRPChartProps {
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

function IGRPRadarChart({
  data,
  radars,
  angleAxisKey,
  title,
  description,
  legendPosition = 'none',
  customLegend,
  showTooltip = true,
  size = 'md',
  height,
  width,
  className,
  valueFormatter,
  gridColor = '#e5e7eb',
  backgroundColor,
  tooltipIndicator = 'line',
  footer,
  polarGridType = 'polygon',
  polarGridLineType = 'solid',
  showPolarGrid = true,
  showRadiusAxis = false,
  radiusAxisDomain,
  radiusAxisAngle = 30,
  customAngleAxisTick,
  showRadiusLines = true,
  gridFilled = false,
}: IGRPRadarChartProps) {
  const chartHeight = getChartHeight(size, data, height);
  const chartWidth = getChartWidth(width);
  const formatValue = (value: number) => formatChartValue(value, valueFormatter);
  const chartConfig = createChartConfig(radars);

  return (
    <div
      className={`w-full overflow-hidden ${className || ''}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {(title || description) && (
        <div className={cn('pb-3')}>
          {title && <div className={cn('text-xl font-semibold')}>{title}</div>}
          {description && <div className={cn('text-sm text-muted-foreground')}>{description}</div>}
        </div>
      )}

      <div className={cn('overflow-hidden')}>
        <div
          style={{ height: chartHeight, width: chartWidth }}
          className={cn('w-full overflow-hidden')}
        >
          <ChartContainer className={cn('h-full w-full')} config={chartConfig}>
            <RadarChart
              data={data}
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              {showTooltip && (
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator={tooltipIndicator} />}
                />
              )}

              {showPolarGrid && (
                <PolarGrid
                  gridType={polarGridType}
                  strokeDasharray={
                    polarGridLineType === 'dashed'
                      ? '5 5'
                      : polarGridLineType === 'dotted'
                        ? '1 5'
                        : undefined
                  }
                  stroke={gridColor}
                  radialLines={showRadiusLines}
                  fill={gridFilled ? `var(--chart-1-20)` : undefined}
                />
              )}

              <PolarAngleAxis
                dataKey={angleAxisKey}
                tick={customAngleAxisTick}
                stroke={gridColor}
              />

              {showRadiusAxis && (
                <PolarRadiusAxis
                  angle={radiusAxisAngle}
                  domain={radiusAxisDomain || [0, 'auto']}
                  tickFormatter={formatValue}
                  stroke={gridColor}
                />
              )}

              {legendPosition !== 'none' && customLegend && (
                <Legend
                  verticalAlign={getLegendVerticalAlign(legendPosition)}
                  align={getLegendHorizontalAlign(legendPosition)}
                  layout={getLegendLayout(legendPosition)}
                  content={customLegend}
                />
              )}

              {legendPosition !== 'none' && !customLegend && (
                <ChartLegend
                  verticalAlign={getLegendVerticalAlign(legendPosition)}
                  align={getLegendHorizontalAlign(legendPosition)}
                  layout={getLegendLayout(legendPosition)}
                  content={<ChartLegendContent className={cn('text-xs')} />}
                />
              )}

              {radars.map((radar, index) => (
                <Radar
                  key={radar.dataKey}
                  name={radar.name || radar.dataKey}
                  dataKey={radar.dataKey}
                  stroke={radar.color || `var(--chart-${(index % 8) + 1})`}
                  fill={radar.fill || radar.color || `var(--chart-${(index % 8) + 1})`}
                  fillOpacity={radar.fillOpacity || 0.6}
                  strokeWidth={radar.strokeWidth || 2}
                  dot={radar.dot}
                  activeDot={radar.activeDot}
                  isAnimationActive={radar.isAnimationActive}
                />
              ))}
            </RadarChart>
          </ChartContainer>
        </div>
      </div>

      {footer && (
        <div className={cn('flex-col items-start gap-2 text-sm pt-4')}>
          {footer.description && (
            <div className={cn('leading-none text-muted-foreground')}>{footer.description}</div>
          )}
        </div>
      )}
    </div>
  );
}

export { IGRPRadarChart, type IGRPRadarChartProps };
