'use client';

import { Fragment, useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IGRPIcon,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  useIsMobile,
  cn,
} from '@igrp/igrp-framework-react-design-system';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface IGRPTemplateBreadcrumbsProps {
  className?: string;
  /**
   * Custom labels for specific path segments.
   * Key should be the path segment (e.g., 'users' or '/users/123')
   */
  customLabels?: Record<string, string>;
  /**
   * Custom home label. Defaults to 'Home'
   */
  homeLabel?: string;
  /**
   * Custom home href. Defaults to '/'
   */
  homeHref?: string;
  /**
   * Maximum number of items to show before collapsing. Defaults to 4
   */
  maxItems?: number;
  /**
   * Number of items to show at the end when collapsed. Defaults to 1
   */
  itemsAfterCollapse?: number;
}

function formatSegmentLabel(segment: string): string {
  return segment
    .split(/[-_]/)
    .flatMap((part) => part.split(/(?=[A-Z])/))
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function IGRPTemplateBreadcrumbs({
  className,
  customLabels = {},
  homeLabel = 'Home',
  homeHref = '/',
  maxItems = 4,
  itemsAfterCollapse = 1,
}: IGRPTemplateBreadcrumbsProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLOListElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!pathname) {
      return [];
    }

    const cleanPathname = pathname.split('?')[0]?.split('#')[0] ?? '';

    if (!cleanPathname || cleanPathname === homeHref) {
      return [];
    }

    const segments = cleanPathname.split('/').filter(Boolean);

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const label = customLabels[segment] ?? customLabels[href] ?? formatSegmentLabel(segment);

      return { label, href };
    });
  }, [pathname, homeHref, customLabels]);

  // Determine if we should check for overflow (only when not already collapsed)
  const shouldCheckOverflow = breadcrumbItems.length <= maxItems && !isMobile;

  // Check for overflow
  useEffect(() => {
    if (!shouldCheckOverflow) {
      setIsOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      // Add a small threshold to account for rounding differences
      const isOverflow = container.scrollWidth > container.clientWidth + 1;
      setIsOverflowing(isOverflow);
    };

    // Use requestAnimationFrame to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      checkOverflow();
    }, 0);

    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(() => {
      if (shouldCheckOverflow) {
        checkOverflow();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [breadcrumbItems, shouldCheckOverflow]);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  const shouldCollapse = breadcrumbItems.length > maxItems || isMobile || isOverflowing;
  const lastItems = breadcrumbItems.slice(-itemsAfterCollapse);
  const middleItems = shouldCollapse ? breadcrumbItems.slice(0, -itemsAfterCollapse) : [];

  const renderBreadcrumbItem = (item: BreadcrumbItem, isLast: boolean, key: string) => (
    <Fragment key={key}>
      <BreadcrumbSeparator>
        <IGRPIcon iconName="ChevronRight" className={cn('h-3 w-3')} strokeWidth={2} />
      </BreadcrumbSeparator>
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage className={cn('text-xs')}>
            {item.label}
          </BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={item.href} className={cn('text-xs')}>
              {item.label}
            </Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </Fragment>
  );

  return (
    <Breadcrumb className={cn('text-xs min-w-0', className)}>
      <BreadcrumbList
        ref={containerRef}
        className={cn('gap-0.5 sm:gap-0.5 text-xs overflow-hidden')}
      >
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href={homeHref}
              className={cn(
                'text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors',
              )}
            >
              <IGRPIcon iconName="House" className={cn('h-3 w-3')} strokeWidth={2} />
              <span className={cn('sr-only')}>{homeLabel}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {shouldCollapse && middleItems.length > 0 ? (
          <>
            <BreadcrumbSeparator>
              <IGRPIcon iconName="ChevronRight" className={cn('h-3 w-3')} strokeWidth={2} />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn('flex items-center gap-1 focus:outline-none')}
                >
                  <BreadcrumbEllipsis />
                  <span className={cn('sr-only')}>Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middleItems.map((item, index) => (
                    <DropdownMenuItem key={`${item.href}-${index}`} asChild>
                      <Link href={item.href} className={cn('flex items-center gap-2')}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            {lastItems.map((item, index) => {
              const isLast = index === lastItems.length - 1;
              return renderBreadcrumbItem(item, isLast, `collapsed-${item.href}-${index}`);
            })}
          </>
        ) : (
          breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return renderBreadcrumbItem(item, isLast, item.href);
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { IGRPTemplateBreadcrumbs, type IGRPTemplateBreadcrumbsProps };
