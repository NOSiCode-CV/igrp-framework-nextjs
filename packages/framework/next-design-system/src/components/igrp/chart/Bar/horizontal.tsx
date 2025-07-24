'use client';

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis, ReferenceLine } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/primitives/chart';
import {
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendLayout,
  getLegendVerticalAlign,
  getLegendHorizontalAlign,
  hasNegativeValues,
  createChartConfig,
} from '../lib';
import type { IGRPHorizontalBarChartProps } from '../types';

function IGRPHorizontalBarChart({
  data,
  bars,
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
  stacked = false,
  className,
  valueFormatter,
  labelFormatter = (value) => (typeof value === 'string' ? value.slice(0, 3) : String(value)),
  barRadius = 5,
  barGap = 8,
  barCategoryGap = '30%',
  gridColor = '#e5e7eb',
  backgroundColor,
  referenceLineColor = '#e5e7eb',
  axisColor = '#d1d5db',
  tooltipIndicator = 'line',
  footer,
}: IGRPHorizontalBarChartProps) {
  const chartHeight = getChartHeight(size, [], height);
  const chartWidth = getChartWidth(width);
  const formatValue = (value: number) => formatChartValue(value, valueFormatter);
  const hasNegativeDataValues = hasNegativeValues(
    data,
    bars.map((b) => b.dataKey),
  );
  const chartConfig = createChartConfig(bars);

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
            <BarChart
              accessibilityLayer
              data={data}
              layout='horizontal'
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              barCategoryGap={barCategoryGap}
              barGap={barGap}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke={gridColor}
                  horizontal={true}
                  vertical={false}
                />
              )}

              <XAxis
                dataKey={categoryKey}
                type='category'
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={labelFormatter}
                interval={0}
                hide={hideAxis || hideXAxis}
                stroke={axisColor}
              />

              <YAxis
                type='number'
                domain={valueDomain || (hasNegativeDataValues ? ['auto', 'auto'] : [0, 'auto'])}
                tickFormatter={formatValue}
                hide={hideAxis || hideYAxis}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
              />

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

              {bars.map((bar) =>
                bar.render ? (
                  bar.render({
                    key: bar.dataKey,
                    dataKey: bar.dataKey,
                    name: bar.name || bar.dataKey,
                    stackId: stacked ? 'stack1' : undefined,
                    fill: `var(--color-${bar.dataKey})`,
                    radius: barRadius,
                  })
                ) : (
                  <Bar
                    key={bar.dataKey}
                    dataKey={bar.dataKey}
                    name={bar.name || bar.dataKey}
                    stackId={stacked ? 'stack1' : undefined}
                    fill={`var(--color-${bar.dataKey})`}
                    radius={barRadius}
                  />
                ),
              )}
            </BarChart>
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

export { IGRPHorizontalBarChart };
