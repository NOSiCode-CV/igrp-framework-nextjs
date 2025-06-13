/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
  LabelList,
  Legend,
  Cell,
  type LegendType,
} from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/primitives/chart';
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
} from '@/components/igrp/chart/lib';
import { type IGRPRadialBarChartProps } from '@/components/igrp/chart/types';

function IGRPRadialBarChart({
  data,
  bars,
  nameKey,
  title,
  description,
  legendPosition = 'none',
  showTooltip = true,
  size = 'md',
  height,
  width,
  className,
  valueFormatter,
  gridColor = '#e5e7eb',
  backgroundColor,
  footer,
  startAngle = 0,
  endAngle = 360,
  innerRadius = '30%',
  outerRadius = '100%',
  barSize,
  showGrid = false,
  gridType = 'circle',
  showBackground = false,
  showRadiusAxis = false,
  centerText = { show: false },
}: IGRPRadialBarChartProps) {
  const chartHeight = getChartHeight(size, data, height);
  const chartWidth = getChartWidth(width);
  const formatValue = (value: number) => formatChartValue(value, valueFormatter);
  const chartConfig = createChartConfig(bars);

  const calculateTotal = () => {
    if (!centerText.show || data.length === 0 || bars.length === 0) return 0;

    if (centerText.value !== undefined) {
      return Number(centerText.value);
    }

    if (bars.length === 1) {
      return Number(data[0][bars[0].dataKey]);
    } else {
      return bars.reduce((sum, bar) => sum + Number(data[0][bar.dataKey]), 0);
    }
  };

  const totalValue = calculateTotal();
  const formattedTotal = centerText.formatter
    ? centerText.formatter(totalValue)
    : formatValue(totalValue);

  const formatLabel = (
    entry: any,
    dataKey: string,
    type: 'value' | 'name' | 'percent' = 'value',
  ) => {
    if (!entry) return '';

    switch (type) {
      case 'name':
        return entry[nameKey] || '';
      case 'percent':
        try {
          const total = data.reduce((sum, item) => sum + Number(item[dataKey] || 0), 0);
          if (total === 0) return '0%';
          const percent = ((Number(entry[dataKey] || 0) / total) * 100).toFixed(0);
          return `${percent}%`;
        } catch {
          return '0%';
        }
      case 'value':
      default:
        return formatValue(Number(entry[dataKey] || 0));
    }
  };

  const legendPayload = React.useMemo(() => {
    if (legendPosition === 'none' || !bars.length || !data.length) return [];

    if (bars.length === 1 && data.length > 1) {
      return data.map((entry, index) => ({
        value: entry[nameKey] || `Item ${index + 1}`,
        type: 'square' as LegendType,
        color: `var(--chart-${(index % 8) + 1})`,
        payload: { ...entry, strokeDasharray: '' },
      }));
    }

    return bars.map((bar, index) => ({
      value: bar.name || bar.dataKey || `Series ${index + 1}`,
      type: 'square' as LegendType,
      color: bar.color || `var(--chart-${(index % 8) + 1})`,
      payload: { dataKey: bar.dataKey, strokeDasharray: '' },
    }));
  }, [bars, data, nameKey, legendPosition]);
  const enhancedData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      _fill: bars[0].color || `var(--chart-${(index % 8) + 1})`,
    }));
  }, [data, bars]);

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
            <RadialBarChart
              data={enhancedData}
              startAngle={startAngle}
              endAngle={endAngle}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              barSize={barSize}
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
                  content={(props) => {
                    if (!props.active || !props.payload || !props.payload.length) {
                      return null;
                    }

                    const item = props.payload[0].payload;
                    const value = props.payload[0].value;
                    const name = item[nameKey];
                    const fill = item._fill;

                    return (
                      <div className='rounded-lg border bg-background p-2 shadow-md'>
                        <div className='flex flex-col gap-1'>
                          <div className='text-sm font-medium'>{name}</div>
                          <div className='flex items-center gap-2'>
                            <div
                              className='h-3 w-3 rounded-full'
                              style={{ backgroundColor: fill }}
                            />
                            <span className='text-sm'>{formatValue(Number(value))}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              )}

              {showGrid && (
                <PolarGrid
                  gridType={gridType}
                  stroke={gridColor}
                />
              )}

              {showRadiusAxis && (
                <PolarRadiusAxis
                  tick
                  tickFormatter={formatValue}
                  stroke={gridColor}
                >
                  {centerText.show && (
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor='middle'
                              dominantBaseline='middle'
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className='fill-foreground text-3xl font-bold'
                              >
                                {formattedTotal}
                              </tspan>
                              {centerText.label && (
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className='fill-muted-foreground'
                                >
                                  {centerText.label}
                                </tspan>
                              )}
                            </text>
                          );
                        }
                      }}
                    />
                  )}
                </PolarRadiusAxis>
              )}

              {!showRadiusAxis && centerText.show && (
                <PolarRadiusAxis
                  tick={false}
                  tickLine={false}
                  axisLine={false}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor='middle'
                            dominantBaseline='middle'
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className='fill-foreground text-3xl font-bold'
                            >
                              {formattedTotal}
                            </tspan>
                            {centerText.label && (
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className='fill-muted-foreground'
                              >
                                {centerText.label}
                              </tspan>
                            )}
                          </text>
                        );
                      }
                    }}
                  />
                </PolarRadiusAxis>
              )}

              <RadialBar
                dataKey={bars[0].dataKey}
                background={showBackground}
                cornerRadius={bars[0].cornerRadius}
                stackId={bars[0].stackId}
                className='stroke-transparent stroke-2'
                name={bars[0].name || bars[0].dataKey}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={bars[0].color || `var(--chart-${(index % 8) + 1})`}
                  />
                ))}

                {bars[0].showLabels && (
                  <LabelList
                    dataKey={bars[0].labelType === 'name' ? nameKey : bars[0].dataKey}
                    position={bars[0].labelPosition || 'insideStart'}
                    className='fill-white capitalize mix-blend-luminosity'
                    fontSize={11}
                    style={bars[0].labelStyle}
                    formatter={(entry: { payload: any }) => {
                      if (!entry || !entry.payload) return '';
                      return formatLabel(entry.payload, bars[0].dataKey, bars[0].labelType);
                    }}
                  />
                )}
              </RadialBar>

              {bars.slice(1).map((bar, index) => (
                <RadialBar
                  key={`bar-${index + 1}`}
                  dataKey={bar.dataKey}
                  name={bar.name || bar.dataKey}
                  fill={bar.color || `var(--chart-${((index + 1) % 8) + 1})`}
                  background={showBackground}
                  cornerRadius={bar.cornerRadius}
                  stackId={bar.stackId}
                  className='stroke-transparent stroke-2'
                >
                  {bar.showLabels && (
                    <LabelList
                      dataKey={bar.labelType === 'name' ? nameKey : bar.dataKey}
                      position={bar.labelPosition || 'insideStart'}
                      className='fill-white capitalize mix-blend-luminosity'
                      fontSize={11}
                      style={bar.labelStyle}
                      formatter={(entry: { payload: any }) => {
                        if (!entry || !entry.payload) return '';
                        return formatLabel(entry.payload, bar.dataKey, bar.labelType);
                      }}
                    />
                  )}
                </RadialBar>
              ))}

              {legendPosition !== 'none' && (
                <Legend
                  verticalAlign={getLegendVerticalAlign(legendPosition)}
                  align={getLegendHorizontalAlign(legendPosition)}
                  layout={getLegendLayout(legendPosition)}
                  payload={legendPayload}
                  iconSize={10}
                  iconType='square'
                  wrapperStyle={{ paddingTop: 10 }}
                  className='text-xs fill-foreground'
                />
              )}
            </RadialBarChart>
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

export { IGRPRadialBarChart };
