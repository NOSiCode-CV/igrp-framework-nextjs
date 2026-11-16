'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { cn } from '@igrp/igrp-framework-react-design-system';

import { IGRPTemplateToaster } from './toaster.js';

export type IGRPRootProvidersBlankProps = {
  /**
   * @deprecated Pass `toaster={<IGRPTemplateToaster {...config} />}` instead.
   * Still used when `toaster` is omitted.
   */
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
  /** The toaster element; `null` renders none. Defaults to `IGRPTemplateToaster` with `toasterConfig`. */
  toaster?: React.ReactNode | null;
  children: React.ReactNode;
  className?: string;
};

export function IGRPRootProvidersBlank({
  toasterConfig,
  toaster,
  children,
  className,
}: IGRPRootProvidersBlankProps) {
  return (
    <div className={cn('min-h-screen', className)}>
      {children}
      {toaster === undefined ? <IGRPTemplateToaster {...toasterConfig} /> : toaster}
    </div>
  );
}
