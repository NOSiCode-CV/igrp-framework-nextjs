'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { IGRP_LOCALE_NATIVE_NAMES, type IGRPLocale } from '../config.js';
import type { IGRPSetLocaleResult } from '../server/set-locale.js';
import { igrpRunLocaleChange } from './locale-change.js';
import { useIGRPLocaleInfo } from './locale-info.js';

export interface IGRPLocaleSwitcherProps {
  /** The app's `'use server'` wrapper around `igrpSetLocale`. Server actions cross to client props. */
  action: (value: string) => Promise<IGRPSetLocaleResult>;
  /**
   * Runs after a successful change and before `router.refresh()`. An app whose
   * session token must follow calls next-auth `update({ locale })` here. A
   * function prop, so pass it from a client component.
   */
  onChanged?: (locale: IGRPLocale) => void | Promise<void>;
  className?: string;
}

/**
 * Icon-sized language selector: the current code (PT, EN, FR) opens a menu of
 * the enabled locales in their native names. Renders nothing when fewer than
 * two locales are enabled.
 */
export function IGRPLocaleSwitcher({ action, onChanged, className }: IGRPLocaleSwitcherProps) {
  const t = useTranslations('i18n.localeSwitcher');
  const { locale, locales } = useIGRPLocaleInfo();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (locales.length < 2) return null;

  const handleChange = (next: string) => {
    if (next === locale) return;
    setFailed(false);
    startTransition(async () => {
      // Never let a rejected action or `onChanged` escape the transition: React
      // would hand it to the nearest error boundary and the segment would crash
      // instead of showing the error state.
      const failed = await igrpRunLocaleChange(next, {
        action,
        onChanged,
        refresh: () => router.refresh(),
      });
      setFailed(failed);
    });
  };

  const label = failed ? t('changeError') : t('label');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative size-6', className)}
          disabled={isPending}
          aria-label={label}
          title={label}
        >
          {isPending ? (
            <IGRPIcon
              iconName="LoaderCircle"
              strokeWidth={2}
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <span aria-hidden="true" className="text-xs font-semibold">
              {locale.toUpperCase()}
            </span>
          )}
          {failed && (
            <span
              aria-hidden="true"
              className="bg-destructive absolute top-0 right-0 size-1.5 rounded-full"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
          {locales.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {IGRP_LOCALE_NATIVE_NAMES[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
