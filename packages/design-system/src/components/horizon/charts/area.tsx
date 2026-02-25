'use client';

import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis, ReferenceLine } from 'recharts';

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
  hasNegativeValues,
} from './lib';
import type { IGRPAreaConfig, IGRPChartProps } from './types';

// TODO: check to assign areas props default value

interface IGRPAreaChartProps extends IGRPChartProps {
  areas: IGRPAreaConfig[];
  expanded?: boolean;
}

function IGRPAreaChart({
  data,
  areas,
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
  expanded = false,
  className,
  valueFormatter,
  labelFormatter = (value) => (typeof value === 'string' ? value : String(value)),
  gridColor = '#e5e7eb',
  backgroundColor,
  referenceLineColor = '#e5e7eb',
  axisColor = '#d1d5db',
  tooltipIndicator = 'line',
  footer,
}: IGRPAreaChartProps) {
  const chartHeight = getChartHeight(size, data, height);
  const chartWidth = getChartWidth(width);
  const formatValue = (value: number) => formatChartValue(value, valueFormatter);
  const hasNegativeDataValues = hasNegativeValues(
    data,
    areas.map((a) => a.dataKey),
  );
  const chartConfig = createChartConfig(areas);

  return (
    <div
      className={cn(`w-full overflow-hidden ${className || ''}`)}
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
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                top: 10,
                right: 5,
                left: 5,
                bottom: 5,
              }}
              stackOffset={expanded ? 'expand' : stacked ? 'none' : undefined}
            >
              {showGrid && <CartesianGrid stroke={gridColor} vertical={false} />}

              <XAxis
                dataKey={categoryKey}
                type="category"
                tickFormatter={labelFormatter}
                hide={hideAxis || hideXAxis}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              {!hideAxis && !hideYAxis && (
                <YAxis
                  type="number"
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
                <ReferenceLine y={0} stroke={referenceLineColor} />
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
                  content={<ChartLegendContent className={cn('text-xs')} />}
                />
              )}

              <defs>
                {areas
                  .filter((area) => area.gradient === true)
                  .map((area) => (
                    <linearGradient
                      key={`fill${area.dataKey}`}
                      id={`fill${area.dataKey}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${area.dataKey})`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${area.dataKey})`}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
              </defs>

              {areas.map((area) =>
                area.render ? (
                  area.render({
                    key: area.dataKey,
                    dataKey: area.dataKey,
                    name: area.name || area.dataKey,
                    stackId: stacked || expanded ? 'stack1' : undefined,
                    fill:
                      area.gradient === true
                        ? `url(#fill${area.dataKey})`
                        : `var(--color-${area.dataKey})`,
                    fillOpacity: area.fillOpacity || 0.6,
                    stroke: `var(--color-${area.dataKey})`,
                    type: area.type || 'monotone',
                  })
                ) : (
                  <Area
                    key={area.dataKey}
                    dataKey={area.dataKey}
                    name={area.name || area.dataKey}
                    stackId={stacked || expanded ? 'stack1' : undefined}
                    fill={
                      area.gradient === true
                        ? `url(#fill${area.dataKey})`
                        : `var(--color-${area.dataKey})`
                    }
                    fillOpacity={area.fillOpacity || 0.4}
                    stroke={`var(--color-${area.dataKey})`}
                    type={area.type || 'monotone'}
                  />
                ),
              )}
            </AreaChart>
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

export { IGRPAreaChart, type IGRPAreaChartProps };
