'use client';

import { Suspense, lazy } from 'react';

import { cn } from '../../../lib/utils';
import type { IGRPLineChartProps, LineConfig } from './line-chart-inner';

const IGRPLineChartLazy = lazy(() =>
  import('./line-chart-inner').then((m) => ({ default: m.default })),
);

/**
 * Line chart with optional grid, tooltip, and legend.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPLineChart(props: IGRPLineChartProps) {
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
      <IGRPLineChartLazy {...props} />
    </Suspense>
  );
}

export { IGRPLineChart, type LineConfig, type IGRPLineChartProps };
