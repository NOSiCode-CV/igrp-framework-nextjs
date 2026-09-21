'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, cn, igrpFormatMessage } from '@igrp/igrp-framework-react-design-system';

import { withBasePath } from '../lib/utils.js';

interface IGRPCarousel {
  image: string;
  title: string;
  description: string;
}

interface IGRPAuthCarouselProps {
  carouselItems: IGRPCarousel[];
  intervalTime?: number;
  /** `aria-label` of the carousel region. pt-PT default. */
  regionLabel?: string;
  /** `aria-label` of a slide dot. `{index}` is substituted (1-based). */
  goToSlideLabel?: string;
}

function IGRPAuthCarousel({
  carouselItems,
  intervalTime = 6000,
  regionLabel = 'Destaques',
  goToSlideLabel = 'Ir para o destaque {index}',
}: IGRPAuthCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || carouselItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [carouselItems.length, intervalTime]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden bg-muted')}
      role="region"
      aria-roledescription="carousel"
      aria-label={regionLabel}
    >
      <div className={cn('relative h-full')}>
        {carouselItems.map((item, index) => {
          const isCurrent = index === currentIndex;
          return (
            <div
              // Index, not `item.image`: slides are positional and never
              // reorder, and two slides may legitimately share one background
              // with different captions — which a src-based key turns into a
              // duplicate-key crash.
              key={index}
              // `opacity-0` hides a slide visually but leaves it in the
              // accessibility tree AND the tab order — `pointer-events-none`
              // only stops the mouse. Every off-screen slide's heading was
              // announced, and its controls were reachable by keyboard. `inert`
              // removes both; `aria-hidden` covers browsers without it.
              inert={!isCurrent}
              aria-hidden={!isCurrent}
              className={cn(
                'absolute inset-0 h-full w-full transition-opacity duration-1000',
                isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
            >
              <Image
                src={withBasePath(item.image)}
                alt={item.title}
                fill
                priority={index === 0}
                className={cn('object-cover')}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* Fixed light-on-dark contrast: this caption sits over an arbitrary
                photo, so theme-inverting semantic tokens would harm readability. */}
              <div className={cn('absolute inset-0 bg-black/40')} />

              <div className={cn('absolute bottom-0 left-0 right-0 p-8 pb-16 text-white')}>
                <h2 className={cn('text-3xl font-bold')}>{item.title}</h2>
                <p className={cn('mt-2 text-md text-slate-200')}>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ONE set of dots for the whole carousel, outside the slides. It used to
          be nested inside each slide, so N slides rendered N x N buttons. */}
      {carouselItems.length > 1 && (
        <div className={cn('absolute bottom-8 left-8 flex justify-start gap-2')}>
          {carouselItems.map((_, idx) => (
            <Button
              variant="ghost"
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                'h-3 rounded-full w-3 bg-white/50 p-0 transition-[width,background-color] duration-350 delay-350',
                idx === currentIndex ? 'w-6 bg-white' : 'hover:bg-white/80',
              )}
              aria-label={igrpFormatMessage(goToSlideLabel, { index: idx + 1 })}
              aria-current={idx === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { IGRPAuthCarousel, type IGRPAuthCarouselProps, type IGRPCarousel };
