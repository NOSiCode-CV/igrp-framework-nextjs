'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  className?: string;
}

// TODO: use breadcrumbs from shadcn-ui

export function IGRPBreadcrumbs({ className }: BreadcrumbsProps) {
  const homeHref = '/';
  const pathname = usePathname();

  if (pathname === homeHref) return null;

  const breadcrumbItems = pathname
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
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs', className)}>
      <ol className="flex items-center flex-wrap gap-1.5">
        <li className="flex items-center">
          <Link
            href={homeHref}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <IGRPIcon iconName="House" className="h-3 w-3" strokeWidth={2} />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            <IGRPIcon
              iconName="ChevronRight"
              className="h-3 w-3 text-muted-foreground"
              aria-hidden="true"
              strokeWidth={2}
            />
            {index === breadcrumbItems.length - 1 || !item.href ? (
              <span className="ml-1.5 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
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
