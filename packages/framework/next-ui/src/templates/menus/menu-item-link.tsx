'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@igrp/igrp-framework-react-design-system';
import { ArrowUpRightIcon } from 'lucide-react';

// `style` is omitted from the typed surface because next/link types it more
// narrowly than the Radix-augmented React.CSSProperties that
// ComponentPropsWithoutRef<'a'> carries (a `--radix-*` index signature), which
// makes `{...rest}` unassignable to <Link>. Any Slot-injected `style` still
// flows through `...rest` at runtime; menu link styling rides on className.
interface MenuItemLinkProps extends Omit<React.ComponentPropsWithoutRef<'a'>, 'style'> {
  href: string;
  isAnchor: boolean;
  isActive: boolean;
  target?: string;
  children: React.ReactNode;
}

/**
 * Shared anchor/Link renderer for the sidebar menu surfaces (leaf, sub-leaf,
 * search results). Renders a SINGLE root element and forwards ref + all extra
 * props, so it composes with the Radix `asChild` Slots the sidebar uses
 * (SidebarMenuButton / SidebarMenuSubButton / DropdownMenuItem).
 *
 * External/anchor items render a plain <a> (new tab, noopener). Internal items
 * render next/link. `aria-current="page"` is derived from `isActive`. The caller
 * supplies `aria-label`, `className`, and the inner icon/label content.
 */
const MenuItemLink = forwardRef<HTMLAnchorElement, MenuItemLinkProps>(function MenuItemLink(
  { href, isAnchor, isActive, target, children, onPointerEnter, onFocus, ...rest },
  ref,
) {
  const router = useRouter();
  const ariaCurrent = isActive ? 'page' : undefined;

  if (isAnchor) {
    const resolvedTarget = target ?? '_blank';
    return (
      <a
        ref={ref}
        href={href}
        target={resolvedTarget}
        rel="noopener noreferrer"
        aria-current={ariaCurrent}
        onPointerEnter={onPointerEnter}
        onFocus={onFocus}
        {...rest}
      >
        {children}
        {/* Visible new-tab cue; the aria-label already says it to screen readers. */}
        {resolvedTarget === '_blank' && (
          <ArrowUpRightIcon
            size={16}
            aria-hidden
            className={cn('ml-auto shrink-0 opacity-60 group-data-[collapsible=icon]:hidden')}
          />
        )}
      </a>
    );
  }

  // A long sidebar prefetched every visible route on mount; prefetch on intent instead.
  const prefetch = () => {
    if (href !== '#') router.prefetch(href);
  };

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={false}
      aria-current={ariaCurrent}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        prefetch();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        prefetch();
      }}
      {...rest}
    >
      {children}
    </Link>
  );
});

export { MenuItemLink, type MenuItemLinkProps };
