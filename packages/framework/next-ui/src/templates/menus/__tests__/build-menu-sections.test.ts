import { describe, it, expect } from 'vitest';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';

import {
  buildMenuSections,
  findActiveHref,
  isItemActive,
  resolveAnchorTag,
  resolveHref,
} from '../utils.js';

function item(partial: Partial<IGRPMenuItemArgs> & { code: string }): IGRPMenuItemArgs {
  return {
    name: partial.code,
    status: 'ACTIVE',
    type: 'MENU',
    ...partial,
  } as IGRPMenuItemArgs;
}

describe('buildMenuSections', () => {
  it('keeps a folder’s direct children', () => {
    const sections = buildMenuSections([
      item({ code: 'f', type: 'FOLDER' }),
      item({ code: 'a', parentCode: 'f', pageSlug: 'a' }),
      item({ code: 'b', parentCode: 'f', pageSlug: 'b' }),
    ]);

    expect(sections).toHaveLength(1);
    const folder = sections[0]!.nodes[0]!;
    expect(folder.kind).toBe('folder');
    expect(folder.kind === 'folder' && folder.children.map((c) => c.item.code)).toEqual(['a', 'b']);
  });

  /**
   * Regression: a FOLDER nested inside a FOLDER used to be typed as a leaf, so
   * its whole subtree vanished from the sidebar AND from menu search — routes
   * the backend advertised became unreachable with no error.
   */
  it('hoists a nested folder’s leaves instead of dropping them', () => {
    const sections = buildMenuSections([
      item({ code: 'f', type: 'FOLDER' }),
      item({ code: 'nested', type: 'FOLDER', parentCode: 'f' }),
      item({ code: 'deep', parentCode: 'nested', pageSlug: 'deep' }),
      item({ code: 'shallow', parentCode: 'f', pageSlug: 'shallow' }),
    ]);

    const folder = sections[0]!.nodes[0]!;
    expect(folder.kind === 'folder' && folder.children.map((c) => c.item.code).sort()).toEqual([
      'deep',
      'shallow',
    ]);
  });

  it('terminates on a parentCode cycle', () => {
    const sections = buildMenuSections([
      item({ code: 'f', type: 'FOLDER' }),
      item({ code: 'x', type: 'FOLDER', parentCode: 'f' }),
      item({ code: 'y', type: 'FOLDER', parentCode: 'x' }),
      // y is x's parent AND x is y's parent
      item({ code: 'x2', type: 'FOLDER', parentCode: 'y', pageSlug: 'x2' }),
    ]);
    const folder = sections[0]!.nodes[0]!;
    expect(folder.kind).toBe('folder');
  });

  it('groups items under a GROUP and collects ungrouped ones into a root section', () => {
    const sections = buildMenuSections([
      item({ code: 'loose', pageSlug: 'loose', position: 1 }),
      item({ code: 'g', type: 'GROUP', name: 'Grupo', position: 2 }),
      item({ code: 'inside', parentCode: 'g', pageSlug: 'inside', position: 3 }),
    ]);

    expect(sections.map((s) => s.label)).toEqual([undefined, 'Grupo']);
    expect(sections[1]!.nodes.map((n) => n.item.code)).toEqual(['inside']);
  });

  it('drops inactive items', () => {
    expect(buildMenuSections([item({ code: 'a', status: 'INACTIVE', pageSlug: 'a' })])).toEqual([]);
  });

  /** Regression: children of an INACTIVE folder were promoted to top-level links. */
  it('hides the whole subtree of an inactive ancestor', () => {
    const sections = buildMenuSections([
      item({ code: 'ADMIN', type: 'FOLDER', status: 'INACTIVE' }),
      item({ code: 'users', parentCode: 'ADMIN', pageSlug: 'users' }),
      item({ code: 'sub', type: 'FOLDER', parentCode: 'ADMIN' }),
      item({ code: 'deep', parentCode: 'sub', pageSlug: 'deep' }),
      item({ code: 'home', pageSlug: 'home' }),
    ]);
    expect(sections.flatMap((s) => s.nodes.map((n) => n.item.code))).toEqual(['home']);
  });

  it('still promotes a child whose parent is absent from the data', () => {
    const sections = buildMenuSections([
      item({ code: 'orphan', parentCode: 'gone', pageSlug: 'o' }),
    ]);
    expect(sections[0]!.nodes.map((n) => n.item.code)).toEqual(['orphan']);
  });

  /** Regression: a GROUP inside a GROUP rendered as a `#` leaf and its subtree vanished. */
  it('renders a nested GROUP as a folder with its leaves', () => {
    const sections = buildMenuSections([
      item({ code: 'g', type: 'GROUP', name: 'Grupo' }),
      item({ code: 'inner', type: 'GROUP', parentCode: 'g' }),
      item({ code: 'leaf', parentCode: 'inner', pageSlug: 'leaf' }),
    ]);
    const node = sections[0]!.nodes[0]!;
    expect(node.kind).toBe('folder');
    expect(node.kind === 'folder' && node.children.map((c) => c.item.code)).toEqual(['leaf']);
  });
});

describe('resolveHref', () => {
  it('never yields a protocol-relative href from a pageSlug', () => {
    expect(resolveHref(item({ code: 'a', pageSlug: '//evil.example' }))).toBe('/evil.example');
    expect(resolveHref(item({ code: 'b', pageSlug: '/\\evil.example' }))).toBe('/evil.example');
    expect(resolveHref(item({ code: 'c', pageSlug: '/users' }))).toBe('/users');
  });
});

describe('findActiveHref / isItemActive', () => {
  const page = item({ code: 'u', pageSlug: 'users' });
  const active = (menus: IGRPMenuItemArgs[], pathname: string) =>
    findActiveHref(buildMenuSections(menus), pathname);

  it('matches the route and its children, not a sibling with a shared prefix', () => {
    expect(resolveHref(page)).toBe('/users');
    expect(active([page], '/users')).toBe('/users');
    expect(active([page], '/users/42')).toBe('/users');
    expect(active([page], '/users-admin')).toBeNull();
  });

  /** Regression: `/admin` and `/admin/users` were both current on `/admin/users`. */
  it('picks only the longest matching href', () => {
    const admin = item({ code: 'admin', pageSlug: 'admin' });
    const f = item({ code: 'f', type: 'FOLDER' });
    const users = item({ code: 'users', parentCode: 'f', pageSlug: 'admin/users' });
    const href = active([admin, f, users], '/admin/users/7');
    expect(href).toBe('/admin/users');
    expect(isItemActive(users, href)).toBe(true);
    expect(isItemActive(admin, href)).toBe(false);
  });

  it('never marks an external link active', () => {
    const external = item({ code: 'e', url: 'https://example.com' });
    expect(active([external], 'https://example.com')).toBeNull();
    expect(isItemActive(external, 'https://example.com')).toBe(false);
  });
});

/**
 * These run under vitest's `node` environment — no `window` — which is exactly
 * the SSR pass. The design system's `igrpIsExternalUrl` swallows the resulting
 * ReferenceError and answers `false` for every URL there, so building on it
 * made the server render `next/link` and the client `<a target="_blank">`: a
 * hydration mismatch on the element type itself.
 */
describe('resolveAnchorTag (no window)', () => {
  it('classifies absolute and protocol-relative URLs as external', () => {
    expect(resolveAnchorTag(item({ code: 'a', url: 'https://example.com' }))).toBe(true);
    expect(resolveAnchorTag(item({ code: 'b', url: 'http://example.com/x' }))).toBe(true);
    expect(resolveAnchorTag(item({ code: 'c', url: '//example.com/x' }))).toBe(true);
  });

  it('keeps in-app destinations internal', () => {
    expect(resolveAnchorTag(item({ code: 'd', pageSlug: 'users' }))).toBe(false);
    expect(resolveAnchorTag(item({ code: 'e', url: '/users' }))).toBe(false);
    expect(resolveAnchorTag(item({ code: 'f', url: 'users' }))).toBe(false);
  });

  it('honours an explicit _blank target regardless of the URL', () => {
    expect(resolveAnchorTag(item({ code: 'g', pageSlug: 'r', target: '_blank' }))).toBe(true);
  });
});
