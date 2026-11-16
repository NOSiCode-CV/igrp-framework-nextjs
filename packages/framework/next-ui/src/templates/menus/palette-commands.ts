import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';

import { buildMenuSections, resolveAnchorTag, resolveHref } from './utils.js';

/**
 * A command palette entry as plain data, so a server component can build it
 * and pass it to the client header (an `IGRPCommandItem.onSelect` cannot cross
 * that boundary).
 */
export interface IGRPPaletteCommand {
  id: string;
  label: string;
  /** Lucide icon name. */
  icon?: string;
  /** Group heading: the menu folder or section the entry lives in. */
  group?: string;
  /** Navigation target, resolved like the sidebar resolves it. */
  href: string;
  /** Opens in a new tab instead of client-side navigation. */
  external?: boolean;
}

/**
 * Palette commands for a menu list: every entry the sidebar would show, with
 * the same href and the same "leaves the app" decision. Server-safe (no
 * `window`), so the layout builds it on the server.
 */
export function igrpMenusToPaletteCommands(menus: IGRPMenuItemArgs[]): IGRPPaletteCommand[] {
  const toCommand = (item: IGRPMenuItemArgs, group: string | undefined): IGRPPaletteCommand => ({
    id: item.code,
    label: item.name,
    ...(item.icon ? { icon: item.icon } : {}),
    ...(group ? { group } : {}),
    href: resolveHref(item),
    ...(resolveAnchorTag(item) ? { external: true } : {}),
  });

  return buildMenuSections(menus)
    .flatMap((section) =>
      section.nodes.flatMap((node) =>
        node.kind === 'folder'
          ? node.children.map((leaf) => toCommand(leaf.item, node.item.name))
          : [toCommand(node.item, section.label)],
      ),
    )
    .filter((command) => command.href !== '#');
}
