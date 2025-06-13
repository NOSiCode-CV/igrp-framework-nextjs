'use client';

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
  ReferenceLine,
  LabelList,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/primitives/chart';
import type { IGRPChartProps, IGRPSeriesConfig } from '@/components/igrp/chart/types';
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
  hasNegativeValues,
} from '@/components/igrp/chart/lib';

export interface LineConfig extends IGRPSeriesConfig {
  type?: 'linear' | 'monotone' | 'step' | 'basis' | 'natural';
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean | object;
  activeDot?: object;
  showLabels?: boolean;
  labelPosition?: 'top' | 'bottom' | 'right' | 'left' | 'center';
  labelOffset?: number;
}

export interface IGRPLineChartProps extends IGRPChartProps {
  lines: LineConfig[];
}

function IGRPLineChart({
  data,
  lines,
  categoryKey,
  title,
  description,
  showGrid = false,
  legendPosition = 'none',
  customLegend,
  showTooltip = true,
  hideAxis = false,
  hideXAxis = false,
  hideYAxis = false,
  showReferenceZero = false,
  valueDomain,
  size = 'md',
  height,
  width,
  className,
  valueFormatter,
  labelFormatter = (value) => value,
  gridColor = '#e5e7eb',
  backgroundColor,
  referenceLineColor = '#e5e7eb',
  axisColor = '#d1d5db',
  tooltipIndicator = 'line',
  footer,
}: IGRPLineChartProps) {
  const chartHeight = getChartHeight(size, data, height);
  const chartWidth = getChartWidth(width);
  const formatValue = (value: number) => formatChartValue(value, valueFormatter);
  const hasNegativeDataValues = hasNegativeValues(
    data,
    lines.map((l) => l.dataKey),
  );
  const chartConfig = createChartConfig(lines);

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
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                top: 20,
                right: 12,
                left: 12,
                bottom: 5,
              }}
            >
              {showGrid && (
                <CartesianGrid
                  stroke={gridColor}
                  vertical={false}
                />
              )}

              <XAxis
                dataKey={categoryKey}
                type='category'
                tickFormatter={labelFormatter}
                hide={hideAxis || hideXAxis}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              {!hideAxis && !hideYAxis && (
                <YAxis
                  type='number'
                  domain={valueDomain || (hasNegativeDataValues ? ['auto', 'auto'] : [0, 'auto'])}
                  tickFormatter={formatValue}
                  hide={hideAxis || hideYAxis}
                  stroke={axisColor}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
              )}

              {showReferenceZero && hasNegativeDataValues && (
                <ReferenceLine
                  y={0}
                  stroke={referenceLineColor}
                />
              )}

              {showTooltip && (
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator={tooltipIndicator} />}
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

              {lines.map((line) =>
                line.render ? (
                  line.render({
                    key: line.dataKey,
                    dataKey: line.dataKey,
                    name: line.name || line.dataKey,
                    stroke: line.color
                      ? line.color
                      : `var(--chart-${(lines.indexOf(line) % 8) + 1})`,
                    strokeWidth: line.strokeWidth || 2,
                    strokeDasharray: line.strokeDasharray,
                    type: line.type || 'monotone',
                    dot:
                      line.dot !== undefined
                        ? line.dot
                        : {
                            fill: line.color
                              ? line.color
                              : `var(--chart-${(lines.indexOf(line) % 8) + 1})`,
                          },
                    activeDot: line.activeDot || { r: 6 },
                  })
                ) : (
                  <Line
                    key={line.dataKey}
                    dataKey={line.dataKey}
                    name={line.name || line.dataKey}
                    stroke={
                      line.color ? line.color : `var(--chart-${(lines.indexOf(line) % 8) + 1})`
                    }
                    strokeWidth={line.strokeWidth || 2}
                    strokeDasharray={line.strokeDasharray}
                    type={line.type || 'monotone'}
                    dot={
                      line.dot !== undefined
                        ? line.dot
                        : {
                            fill: line.color
                              ? line.color
                              : `var(--chart-${(lines.indexOf(line) % 8) + 1})`,
                          }
                    }
                    activeDot={line.activeDot || { r: 6 }}
                  >
                    {line.showLabels && (
                      <LabelList
                        position={line.labelPosition || 'top'}
                        offset={line.labelOffset || 12}
                        className='fill-foreground'
                        fontSize={12}
                      />
                    )}
                  </Line>
                ),
              )}
            </LineChart>
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

export { IGRPLineChart };
