'use client';

import Link from 'next/link';
import { IGRPButton, IGRPImage, cn } from '@igrp/igrp-framework-react-design-system';

interface IGRPTemplateNotFoundProps {
  title?: string;
  /** Sub-heading under the 404. pt-PT default; override for other locales. */
  subtitle?: string;
  description?: string;
  /**
   * Destination of the "back home" action. `next/link` prefixes `basePath`
   * automatically, so keep this app-relative. Pass `null` to render no action.
   */
  homeHref?: string | null;
  /** Label of the "back home" action. pt-PT default. */
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
  subtitle = 'Página não encontrada',
  description = 'Desculpe, a página não foi encontrada.',
  homeHref = '/',
  homeLabel = 'Voltar à Página Inicial',
  image,
  imageAlt = 'Página não encontrada',
  imageWidth = 300,
  imageHeight = 200,
  imageClassName,
  appCode,
}: IGRPTemplateNotFoundProps) {
  return (
    <div className={cn('flex min-h-screen items-center justify-center bg-background px-4 py-16')}>
      <div className={cn('w-full max-w-2xl')}>
        <div className={cn('text-center')}>
          {image && (
            <div className={cn('mb-8 flex justify-center')}>
              <IGRPImage
                src={image}
                alt={imageAlt}
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
            {subtitle}
          </h2>

          <p className={cn('mb-8 text-base text-muted-foreground sm:text-lg')}>{description}</p>

          {homeHref !== null && (
            <div className={cn('flex flex-col items-center justify-center gap-4 sm:flex-row')}>
              <IGRPButton asChild size="lg" className={cn('min-w-40')}>
                <Link href={homeHref}>{homeLabel}</Link>
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
