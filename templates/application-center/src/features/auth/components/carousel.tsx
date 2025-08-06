'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { cn } from '@/lib/utils';

const carouselItems = [
  {
    image: '/igrp/placeholder-carousel.png',
    title: 'Streamlined Workflow',
    description: 'Boost your productivity with our intuitive interface and powerful tools.',
  },
  {
    image: '/igrp/placeholder-carousel.png',
    title: 'Secure by Design',
    description: 'Your data is protected with enterprise-grade security and encryption.',
  },
  {
    image: '/igrp/placeholder-carousel.png',
    title: 'Collaborative Platform',
    description: 'Work together seamlessly with your team in real-time.',
  },
];

export function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className='relative h-full w-full overflow-hidden bg-slate-900'>
      <div className='relative h-full'>
        {carouselItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-1000',
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <Image
              src={item.image || '/placeholder.svg'}
              alt={item.title}
              fill
              priority={index === 0}
              className='object-cover'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />

            <div className='absolute inset-0 bg-black/40' />

            <div className='absolute bottom-0 left-0 right-0 p-8 text-white'>
              <h2 className='text-3xl font-bold'>{item.title}</h2>
              <p className='mt-2 text-md text-slate-200'>{item.description}</p>

              <div className='mt-4 flex justify-start space-x-2'>
                {carouselItems.map((_, idx) => (
                  <IGRPButtonPrimitive
                    variant='ghost'
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={cn(
                      'h-3 rounded-full transition-all delay-350 w-3 bg-white/50 p-0',
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
