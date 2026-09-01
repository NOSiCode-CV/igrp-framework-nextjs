'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

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
  { href, isAnchor, isActive, target, children, ...rest },
  ref,
) {
  const ariaCurrent = isActive ? 'page' : undefined;

  if (isAnchor) {
    return (
      <a
        ref={ref}
        href={href}
        target={target ?? '_blank'}
        rel="noopener noreferrer"
        aria-current={ariaCurrent}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link ref={ref} href={href} aria-current={ariaCurrent} {...rest}>
      {children}
    </Link>
  );
});

export { MenuItemLink, type MenuItemLinkProps };
