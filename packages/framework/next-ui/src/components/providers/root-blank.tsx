'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { cn, IGRPToaster } from '@igrp/igrp-framework-react-design-system';

export type IGRPRootProvidersBlankProps = {
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
  children: React.ReactNode;
  className?: string;
};

export function IGRPRootProvidersBlank({
  toasterConfig,
  children,
  className,
}: IGRPRootProvidersBlankProps) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
  } = toasterConfig ?? {};

  return (
    <div className={cn('min-h-screen', className)}>
      {children}
      {showToaster && (
        <IGRPToaster
          position={position}
          theme={theme}
          richColors={richColors}
          expand={expand}
          duration={duration}
          {...toasterConfig}
        />
      )}
    </div>
  );
}
