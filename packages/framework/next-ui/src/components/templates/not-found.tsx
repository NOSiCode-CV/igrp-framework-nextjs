import Link from 'next/link';
import { IGRPButton, IGRPImage, cn } from '@igrp/igrp-framework-react-design-system';

interface IGRPTemplateNotFoundProps {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  appCode?: string;
}

function IGRPTemplateNotFound({
  title = '404',
  description = 'Desculpe, página não foi encontrada.',
  image,
  imageAlt = 'Página não encontrada',
  imageWidth = 300,
  imageHeight = 200,
  imageClassName,
  appCode,
}: IGRPTemplateNotFoundProps) {
  return (
    <div
      className={cn(
        'flex min-h-[calc(100vh-12rem)] items-center justify-center bg-background px-4 py-16',
      )}
    >
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
            Página não encontrada
          </h2>

          <p className={cn('mb-8 text-base text-muted-foreground sm:text-lg')}>{description}</p>

          <div className={cn('flex flex-col items-center justify-center gap-4 sm:flex-row')}>
            <IGRPButton asChild size="lg" className={cn('min-w-40')}>
              <Link href="/">Voltar à Página Inicial</Link>
            </IGRPButton>
          </div>

          {appCode && <span className={cn('sr-only')}>{appCode}</span>}
        </div>
      </div>
    </div>
  );
}

export { IGRPTemplateNotFound, type IGRPTemplateNotFoundProps };
