/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Pie, PieChart, Sector, Cell, Label, Legend, type LegendType } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/primitives/chart';
import type { IGRPPieChartProps } from '@/components/igrp/chart/types';
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
} from '@/components/igrp/chart/lib';

function IGRPPieChart({
  data,
  pies,
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
  backgroundColor,
  tooltipIndicator = 'line',
  footer,
  centerLabel = { show: false, text: '' },
  interactive = false,
}: IGRPPieChartProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartHeight = getChartHeight(size, data, height);
  const chartWidth = getChartWidth(width);
  const formatValue = (value: number) => formatChartValue(value, valueFormatter);
  const chartConfig = createChartConfig(pies);

  const totalValue = React.useMemo(() => {
    if (!centerLabel.show || !pies.length || !data.length) return 0;
    return data.reduce((sum, entry) => sum + Number(entry[pies[0].dataKey]), 0);
  }, [centerLabel.show, data, pies]);

  const legendPayload = React.useMemo(() => {
    if (legendPosition === 'none' || !pies.length || !data.length) return [];

    if (pies.length === 1) {
      return data.map((entry, index) => ({
        value: entry[nameKey] || `Item ${index + 1}`,
        type: 'square' as LegendType,
        color: pies[0].color || `var(--chart-${(index % 8) + 1})`,
        payload: { ...entry, strokeDasharray: '' },
      }));
    }

    return pies.map((pie, index) => ({
      value: pie.name || pie.dataKey || `Series ${index + 1}`,
      type: 'square' as LegendType,
      color: pie.color || `var(--chart-${(index % 8) + 1})`,
      payload: { dataKey: pie.dataKey, strokeDasharray: '' },
    }));
  }, [pies, data, nameKey, legendPosition]);

  const renderActiveShape = (props: PieSectorDataItem) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={(outerRadius as number) + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={(outerRadius as number) + 10}
          outerRadius={(outerRadius as number) + 20}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.4}
        />
      </g>
    );
  };

  const renderCustomLabel = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
      name,
      percent,
      labelType,
      labelPosition,
    } = props;

    if (!cx || !cy) return null;

    const RADIAN = Math.PI / 180;

    let radius = 0;
    let textAnchor = 'middle';

    if (labelPosition === 'outside') {
      radius = (outerRadius || 0) + 30;
      textAnchor = midAngle > 270 || midAngle < 90 ? 'start' : 'end';
    } else {
      radius =
        innerRadius && outerRadius
          ? innerRadius + (outerRadius - innerRadius) / 2
          : (outerRadius || 0) * 0.7;
    }

    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    let content = '';
    switch (labelType) {
      case 'name':
        content = name || '';
        break;
      case 'percent':
        content = percent ? `${(percent * 100).toFixed(0)}%` : '0%';
        break;
      case 'value':
      default:
        content = value !== undefined ? formatValue(value) : '';
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        dominantBaseline='central'
        className='fill-foreground text-xs'
      >
        {content}
      </text>
    );
  };

  const renderCenterLabel = ({ viewBox }: any) => {
    if (!centerLabel.show || !viewBox || !('cx' in viewBox)) return null;

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
          {formatValue(
            interactive && activeIndex >= 0 && activeIndex < data.length
              ? Number(data[activeIndex][pies[0].dataKey])
              : totalValue,
          )}
        </tspan>
        {centerLabel.text && (
          <tspan
            x={viewBox.cx}
            y={(viewBox.cy || 0) + 24}
            className='fill-muted-foreground'
          >
            {centerLabel.text}
          </tspan>
        )}
      </text>
    );
  };

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
            <PieChart
              margin={{
                top: 20,
                right: 12,
                left: 12,
                bottom: 5,
              }}
            >
              {showTooltip && (
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator={tooltipIndicator} />}
                />
              )}

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

              {pies.map((pie, idx) => (
                <Pie
                  key={`pie-${idx}`}
                  data={data}
                  dataKey={pie.dataKey}
                  nameKey={nameKey}
                  cx={pie.cx || '50%'}
                  cy={pie.cy || '50%'}
                  innerRadius={pie.innerRadius || 0}
                  outerRadius={pie.outerRadius}
                  paddingAngle={pie.paddingAngle || 0}
                  cornerRadius={pie.cornerRadius || 0}
                  startAngle={pie.startAngle || 0}
                  endAngle={pie.endAngle || 360}
                  activeIndex={interactive ? activeIndex : pie.activeIndex}
                  activeShape={pie.activeShape ? renderActiveShape : undefined}
                  onMouseEnter={interactive ? (_, index) => setActiveIndex(index) : undefined}
                  onMouseLeave={interactive ? () => setActiveIndex(-1) : undefined}
                  label={
                    pie.showLabels
                      ? (props) =>
                          renderCustomLabel({
                            ...props,
                            labelType: pie.labelType,
                            labelPosition: pie.labelPosition,
                          })
                      : false
                  }
                  labelLine={pie.labelLine}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pie.color || `var(--chart-${(index % 8) + 1})`}
                    />
                  ))}

                  {idx === 0 && centerLabel.show && <Label content={renderCenterLabel} />}
                </Pie>
              ))}
            </PieChart>
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

export { IGRPPieChart };
