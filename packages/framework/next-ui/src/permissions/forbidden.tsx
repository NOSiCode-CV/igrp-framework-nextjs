'use client';

import Link from 'next/link';
import { IGRPButton } from '@igrp/igrp-framework-react-design-system';

import { useIGRPChromeI18n } from '../i18n/context.js';

export interface IGRPForbiddenProps {
  /** pt-PT default; override for other locales. */
  title?: string;
  description?: string;
  /** Label of the "back home" action. pt-PT default; override for other locales. */
  homeLabel?: string;
  /**
   * Destination of the "back home" action. `next/link` prefixes `basePath`
   * automatically, so keep this app-relative. Pass `null` to render no action —
   * e.g. when the 403 is shown inside a shell that already offers navigation.
   */
  homeHref?: string | null;
}

/** 403 screen. Semantic tokens only; copy from the chrome catalog, overridable per prop. */
export function IGRPForbidden({
  title,
  description,
  homeLabel,
  homeHref = '/',
}: IGRPForbiddenProps) {
  const chrome = useIGRPChromeI18n();
  const copy = {
    title: title ?? chrome.forbidden.title,
    description: description ?? chrome.forbidden.description,
    home: homeLabel ?? chrome.forbidden.home,
  };
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-bold text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold text-foreground">{copy.title}</h1>
      <p className="max-w-md text-muted-foreground">{copy.description}</p>
      {homeHref !== null && (
        <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <IGRPButton asChild size="lg" className="min-w-40">
            <Link href={homeHref}>{copy.home}</Link>
          </IGRPButton>
        </div>
      )}
    </div>
  );
}
