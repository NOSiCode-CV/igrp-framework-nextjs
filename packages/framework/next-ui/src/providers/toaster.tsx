'use client';

import type { ComponentProps } from 'react';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPToaster } from '@igrp/igrp-framework-react-design-system';

/**
 * `IGRPToasterPosition` in `@igrp/framework-next-types` is a hand-written
 * mirror of sonner's `Position`, the same drift class as the Access Management
 * DTOs. This pins both directions: a member the framework offers but sonner
 * rejects fails, and so does a member sonner gains that the framework lacks.
 *
 * It reads the accepted type off `IGRPToaster` rather than importing `sonner`,
 * so `next-ui` gains no dependency. Type-only: Babel emits nothing for it.
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

export type IGRPTemplateToasterProps = Partial<NonNullable<IGRPConfigArgs['toasterConfig']>>;

/**
 * The layout's toaster with the framework defaults. Pass it (with your own
 * props) as `toaster` on `IGRPLayoutFull` / `IGRPLayoutBlank`.
 *
 * Every prop is destructured explicitly: a `{...props}` spread put
 * `showToaster` (a framework flag) onto sonner, and an explicit
 * `position: undefined` beat the default.
 */
export function IGRPTemplateToaster({
  showToaster = true,
  position = 'bottom-right',
  theme = 'system',
  richColors = true,
  expand = false,
  duration = 5000,
  closeButton,
}: IGRPTemplateToasterProps) {
  if (!showToaster) return null;
  return (
    <IGRPToaster
      position={position}
      theme={theme}
      richColors={richColors}
      expand={expand}
      duration={duration}
      closeButton={closeButton}
    />
  );
}
