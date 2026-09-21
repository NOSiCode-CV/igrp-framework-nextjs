'use client';

import type { ComponentProps } from 'react';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { cn, IGRPToaster } from '@igrp/igrp-framework-react-design-system';

/**
 * `IGRPToasterPosition` in `@igrp/framework-next-types` is a hand-written
 * mirror of sonner's `Position`, the same drift class as the Access Management
 * DTOs — and until now nothing pinned it. Passing `position` below only proves
 * one direction: a member the framework offers but sonner rejects fails, while
 * a member sonner *gains* leaves the framework union quietly incomplete, with
 * no signal.
 *
 * This pins both directions. It reads the accepted type off `IGRPToaster`
 * rather than importing `sonner`, so `next-ui` gains no dependency and the
 * assertion tracks what the design system actually accepts.
 *
 * Type-only on purpose: `Assert<T extends true>` fails during type-checking
 * and leaves no value for Babel to emit.
 */
type Assert<T extends true> = T;
type Equivalent<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : { error: 'sonner accepts a position IGRPToasterPosition does not offer'; a: A; b: B }
  : { error: 'IGRPToasterPosition offers a position sonner rejects'; a: A; b: B };

export type _ToasterPositionContract = Assert<
  Equivalent<
    NonNullable<ComponentProps<typeof IGRPToaster>['position']>,
    NonNullable<NonNullable<IGRPConfigArgs['toasterConfig']>['position']>
  >
>;

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
  // `closeButton` is destructured explicitly rather than swept in by a trailing
  // `{...toasterConfig}` spread. That spread put `showToaster` — a framework
  // flag with no meaning to sonner — onto the toaster, and re-applied every raw
  // value AFTER the defaults resolved, so an explicit `position: undefined`
  // silently beat the 'bottom-right' default.
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
    closeButton,
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
          closeButton={closeButton}
        />
      )}
    </div>
  );
}
