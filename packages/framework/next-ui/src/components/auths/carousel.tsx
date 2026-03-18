'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, cn } from '@igrp/igrp-framework-react-design-system';

interface IGRPCarousel {
  image: string;
  title: string;
  description: string;
}

interface IGRPAuthCarouselProps {
  carouselItems: IGRPCarousel[];
  intervalTime?: number;
}

function IGRPAuthCarousel({
  carouselItems,
  intervalTime = 6000,
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
    <div className={cn('relative h-full w-full overflow-hidden bg-slate-900')}>
      <div className={cn('relative h-full')}>
        {carouselItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-1000',
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              priority={index === 0}
              className={cn('object-cover')}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            <div className={cn('absolute inset-0 bg-black/40')} />

            <div className={cn('absolute bottom-0 left-0 right-0 p-8 text-white')}>
              <h2 className={cn('text-3xl font-bold')}>{item.title}</h2>
              <p className={cn('mt-2 text-md text-slate-200')}>{item.description}</p>

              <div className={cn('mt-4 flex justify-start space-x-2')}>
                {carouselItems.map((_, idx) => (
                  <Button
                    variant="ghost"
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={cn(
                      'h-3 rounded-full w-3 bg-white/50 p-0 transition-[width,background-color] duration-350 delay-350',
                      idx === currentIndex ? 'w-6 bg-white' : 'hover:bg-white/80',
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { IGRPAuthCarousel, type IGRPAuthCarouselProps, type IGRPCarousel };
