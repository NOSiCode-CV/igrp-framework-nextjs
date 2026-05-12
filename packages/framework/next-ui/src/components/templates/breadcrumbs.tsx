'use client';

import { Fragment, useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import {
  IGRPIcon,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem as BreadcrumbListItem,
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

/**
 * A single breadcrumb segment. Exported so server layouts can type their
 * item arrays without importing from deep paths.
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface IGRPTemplateBreadcrumbsProps {
  className?: string;
  /**
   * Pre-resolved breadcrumb items. When provided, all URL logic is skipped.
   * Pass from a server component that has access to route params and can fetch
   * data. The home item is always rendered by the component — do not include it.
   */
  items?: BreadcrumbItem[];
  /**
   * App-level route → label map. Keys are full hrefs.
   * Define once in a shared config and import the same object in generateMetadata
   * for a single source of truth between page titles and breadcrumb labels.
   *
   * @example
   * const ROUTE_LABELS = {
   *   '/settings': 'Settings',
   *   '/settings/users': 'User Management',
   * }
   */
  routeLabels?: Record<string, string>;
  /**
   * Per-instance escape hatch for segments not covered by routeLabels.
   * Return undefined to fall through to auto-formatting.
   * Wrap in useCallback to avoid triggering a recompute on every parent render.
   */
  formatLabel?: (segment: string, href: string) => string | undefined;
  /** Screen-reader label for the home icon. Defaults to 'Home' */
  homeLabel?: string;
  /** Home link destination. Defaults to '/' */
  homeHref?: string;
  /** Collapse threshold (item count). Defaults to 4 */
  maxItems?: number;
  /** Items visible after the ellipsis when collapsed. Defaults to 1 */
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
  items,
  routeLabels = {},
  formatLabel,
  homeLabel = 'Home',
  homeHref = '/',
  maxItems = 4,
  itemsAfterCollapse = 1,
}: IGRPTemplateBreadcrumbsProps) {
  // Always call — hooks cannot be conditional. Ignored when items is provided.
  const segments = useSelectedLayoutSegments();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLOListElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    // Controlled mode: items provided — skip all URL logic
    if (items !== undefined) {
      return items;
    }

    // Auto-derive mode: use useSelectedLayoutSegments()
    // Filter route groups like (igrp) and parallel route slots like @slot
    const filteredSegments = segments.filter(
      (segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith('@'),
    );

    if (filteredSegments.length === 0) {
      return [];
    }

    return filteredSegments.map((segment, index) => {
      const href = `/${filteredSegments.slice(0, index + 1).join('/')}`;
      const label =
        routeLabels[href] ??
        formatLabel?.(segment, href) ??
        formatSegmentLabel(segment);

      return { label, href };
    });
  }, [items, segments, routeLabels, formatLabel]);

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
  }, [breadcrumbItems, shouldCheckOverflow, isMobile]);

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
      <BreadcrumbListItem>
        {isLast ? (
          <BreadcrumbPage className={cn('text-xs')}>{item.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={item.href} className={cn('text-xs')}>
              {item.label}
            </Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbListItem>
    </Fragment>
  );

  return (
    <Breadcrumb className={cn('text-xs min-w-0', className)}>
      <BreadcrumbList
        ref={containerRef}
        className={cn('gap-0.5 sm:gap-0.5 text-xs overflow-hidden')}
      >
        <BreadcrumbListItem>
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
        </BreadcrumbListItem>

        {shouldCollapse && middleItems.length > 0 ? (
          <>
            <BreadcrumbSeparator>
              <IGRPIcon iconName="ChevronRight" className={cn('h-3 w-3')} strokeWidth={2} />
            </BreadcrumbSeparator>
            <BreadcrumbListItem>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn('flex items-center gap-1 focus:outline-none')}>
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
            </BreadcrumbListItem>
            {lastItems.map((item, index) => {
              const isLast = index === lastItems.length - 1;
              return renderBreadcrumbItem(item, isLast, `collapsed-${item.href}-${index}`);
            })}
          </>
        ) : (
          breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return renderBreadcrumbItem(item, isLast, `${item.href}-${index}`);
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { IGRPTemplateBreadcrumbs, type IGRPTemplateBreadcrumbsProps };
