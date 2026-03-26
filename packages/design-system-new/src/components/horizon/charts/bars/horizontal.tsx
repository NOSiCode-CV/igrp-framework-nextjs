'use client';

import { Suspense, lazy } from 'react';

import { cn } from '../../../../lib/utils';
import type { IGRPHorizontalBarChartProps } from './horizontal-chart-inner';

const IGRPHorizontalBarChartLazy = lazy(() =>
  import('./horizontal-chart-inner').then((m) => ({ default: m.default })),
);

/**
 * Horizontal bar chart with optional stacking and grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPHorizontalBarChart(props: IGRPHorizontalBarChartProps) {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            'w-full overflow-hidden animate-pulse rounded-lg bg-muted min-h-[200px] aspect-video',
          )}
        />
      }
    >
      <IGRPHorizontalBarChartLazy {...props} />
    </Suspense>
  );
}

export { IGRPHorizontalBarChart, type IGRPHorizontalBarChartProps };
