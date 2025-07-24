'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/primitives/chart';
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
} from '../lib';
import { type IGRPRadarChartProps } from '../types';

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
        <div className='pb-3'>
          {title && <div className='text-xl font-semibold'>{title}</div>}
          {description && <div className='text-sm text-muted-foreground'>{description}</div>}
        </div>
      )}

      <div className='overflow-hidden'>
        <div
          style={{ height: chartHeight, width: chartWidth }}
          className='w-full overflow-hidden'
        >
          <ChartContainer
            className='h-full w-full'
            config={chartConfig}
          >
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
                  content={<ChartLegendContent className='text-xs' />}
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
        <div className='flex-col items-start gap-2 text-sm pt-4'>
          {footer.description && (
            <div className='leading-none text-muted-foreground'>{footer.description}</div>
          )}
        </div>
      )}
    </div>
  );
}

export { IGRPRadarChart };
