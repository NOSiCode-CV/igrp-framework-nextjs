'use client';

import Link from 'next/link';
import { IGRPButton, IGRPImage, cn } from '@igrp/igrp-framework-react-design-system';

import { useIGRPChromeI18n } from '../i18n/context.js';

interface IGRPTemplateNotFoundProps {
  title?: string;
  /** Sub-heading under the 404. Defaults to the chrome catalog. */
  subtitle?: string;
  description?: string;
  /**
   * Destination of the "back home" action. `next/link` prefixes `basePath`
   * automatically, so keep this app-relative. Pass `null` to render no action.
   */
  homeHref?: string | null;
  /** Label of the "back home" action. Defaults to the chrome catalog. */
  homeLabel?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  appCode?: string;
}

function IGRPTemplateNotFound({
  title = '404',
  subtitle,
  description,
  homeHref = '/',
  homeLabel,
  image,
  imageAlt,
  imageWidth = 300,
  imageHeight = 200,
  imageClassName,
  appCode,
}: IGRPTemplateNotFoundProps) {
  const chrome = useIGRPChromeI18n();
  const copy = {
    subtitle: subtitle ?? chrome.notFound.subtitle,
    description: description ?? chrome.notFound.description,
    home: homeLabel ?? chrome.notFound.home,
    imageAlt: imageAlt ?? chrome.notFound.imageAlt,
  };
  return (
    <div className={cn('flex min-h-screen items-center justify-center bg-background px-4 py-16')}>
      <div className={cn('w-full max-w-2xl')}>
        <div className={cn('text-center')}>
          {image && (
            <div className={cn('mb-8 flex justify-center')}>
              <IGRPImage
                src={image}
                alt={copy.imageAlt}
                width={imageWidth}
                height={imageHeight}
                className={cn('mx-auto', imageClassName)}
              />
            </div>
          )}

          <h1 className={cn('mb-4 text-6xl font-bold tracking-tight text-foreground sm:text-7xl')}>
            {title}
          </h1>

          <h2
            className={cn('mb-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl')}
          >
            {copy.subtitle}
          </h2>

          <p className={cn('mb-8 text-base text-muted-foreground sm:text-lg')}>
            {copy.description}
          </p>

          {homeHref !== null && (
            <div className={cn('flex flex-col items-center justify-center gap-4 sm:flex-row')}>
              <IGRPButton asChild size="lg" className={cn('min-w-40')}>
                <Link href={homeHref}>{copy.home}</Link>
              </IGRPButton>
            </div>
          )}

          {appCode && <span className={cn('sr-only')}>{appCode}</span>}
        </div>
      </div>
    </div>
  );
}

export { IGRPTemplateNotFound, type IGRPTemplateNotFoundProps };
