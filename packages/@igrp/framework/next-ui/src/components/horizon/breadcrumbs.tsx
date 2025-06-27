'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  className?: string;
  locale: string;
}

// TODO: use breadcrumbs from shadcn-ui

export function Breadcrumbs({ className, locale }: BreadcrumbsProps) {
  const homeHref = '/';
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  if (pathWithoutLocale === homeHref) return null;

  const breadcrumbItems = pathWithoutLocale
    .split('/')
    .filter(Boolean)
    .map((segment, index, segments) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { label, href };
    });

  return (
    <nav
      aria-label='Breadcrumb'
      className={cn('flex items-center text-xs', className)}
    >
      <ol className='flex items-center flex-wrap gap-1.5'>
        <li className='flex items-center'>
          <Link
            href={homeHref}
            className='text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
          >
            <Home
              className='h-3 w-3'
              strokeWidth={2}
            />
            <span className='sr-only'>Home</span>
          </Link>
        </li>
        {breadcrumbItems.map((item, index) => (
          <li
            key={index}
            className='flex items-center'
          >
            <ChevronRight
              className='h-3 w-3 text-muted-foreground'
              aria-hidden='true'
              strokeWidth={2}
            />
            {index === breadcrumbItems.length - 1 || !item.href ? (
              <span
                className='ml-1.5 font-medium'
                aria-current='page'
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className='ml-1.5 text-muted-foreground hover:text-foreground transition-colors'
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
