import { describe, expect, it } from 'vitest';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';

import {
  activeHrefWithin,
  buildMenuSections,
  findActiveHref,
  isAbsoluteUrl,
  isItemActive,
  resolveHref,
} from '../utils.js';

function item(partial: Partial<IGRPMenuItemArgs> & { code: string }): IGRPMenuItemArgs {
  return { name: partial.code, status: 'ACTIVE', type: 'MENU', ...partial } as IGRPMenuItemArgs;
}

const activeFor = (menus: IGRPMenuItemArgs[], pathname: string) =>
  findActiveHref(buildMenuSections(menus), pathname);

describe('resolveHref', () => {
  it.each([
    ['pageSlug', { pageSlug: 'users' }, '/users'],
    ['nested pageSlug', { pageSlug: 'admin/users' }, '/admin/users'],
    ['root pageSlug', { pageSlug: '/' }, '/'],
    ['pageSlug wins over url', { pageSlug: 'users', url: 'https://example.com' }, '/users'],
    ['relative url', { url: 'reports' }, '/reports'],
    ['rooted url', { url: '/reports' }, '/reports'],
    ['absolute url', { url: 'https://example.com/x' }, 'https://example.com/x'],
    ['empty pageSlug falls back to url', { pageSlug: '', url: '/r' }, '/r'],
    ['nothing', {}, '#'],
    ['null fields', { pageSlug: null, url: null }, '#'],
  ])('%s', (_label, fields, expected) => {
    expect(resolveHref(item({ code: 'x', ...fields }))).toBe(expected);
  });

  it('never yields an executable javascript: href', () => {
    expect(resolveHref(item({ code: 'x', url: 'javascript:alert(1)' }))).toBe(
      '/javascript:alert(1)',
    );
  });
});

describe('isAbsoluteUrl', () => {
  it.each([
    ['https://example.com', true],
    ['HTTP://EXAMPLE.COM', true],
    ['//example.com/x', true],
    ['custom+scheme.v1://x', true],
    ['/users', false],
    ['users', false],
    ['#', false],
    ['', false],
    ['/\\example.com', true],
    ['\\\\example.com', true],
    ['https:/\\example.com', true],
  ])('%s → %s', (url, expected) => {
    expect(isAbsoluteUrl(url)).toBe(expected);
  });
});

describe('findActiveHref', () => {
  const users = item({ code: 'users', pageSlug: 'users' });

  it('picks the item whose query matches on the same route', () => {
    const open = item({ code: 'o', url: '/list?status=open' });
    const closed = item({ code: 'c', url: '/list?status=closed' });
    const sections = buildMenuSections([open, closed]);
    expect(findActiveHref(sections, '/list', new URLSearchParams('status=closed'))).toBe(
      '/list?status=closed',
    );
    expect(findActiveHref(sections, '/list', new URLSearchParams('status=open&page=2'))).toBe(
      '/list?status=open',
    );
    // No query to compare: the first item keeps winning, as before.
    expect(findActiveHref(sections, '/list')).toBe('/list?status=open');
  });

  it('prefers an item without a query over one whose query disagrees', () => {
    const all = item({ code: 'a', url: '/list' });
    const closed = item({ code: 'c', url: '/list?status=closed' });
    const sections = buildMenuSections([closed, all]);
    expect(findActiveHref(sections, '/list', new URLSearchParams('status=open'))).toBe('/list');
  });

  it('still lets a deeper route beat a matching query', () => {
    const q = item({ code: 'q', url: '/list?status=open' });
    const deep = item({ code: 'd', pageSlug: 'list/42' });
    const sections = buildMenuSections([q, deep]);
    expect(findActiveHref(sections, '/list/42', new URLSearchParams('status=open'))).toBe(
      '/list/42',
    );
  });

  it('returns null for an empty menu', () => {
    expect(findActiveHref([], '/users')).toBeNull();
    expect(activeFor([], '/')).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(activeFor([users], '/reports')).toBeNull();
  });

  it('matches a pathname with a trailing slash', () => {
    expect(activeFor([users], '/users/')).toBe('/users');
  });

  it('is case-sensitive', () => {
    expect(activeFor([users], '/Users')).toBeNull();
  });

  it('does not let a root item match every route', () => {
    const home = item({ code: 'home', pageSlug: '/' });
    expect(activeFor([home, users], '/')).toBe('/');
    expect(activeFor([home, users], '/users/1')).toBe('/users');
    expect(activeFor([home], '/reports')).toBeNull();
  });

  // usePathname() strips basePath, so app-relative items match with or without one.
  it('matches app-relative items against the basePath-stripped pathname', () => {
    const viaUrl = item({ code: 'r', url: '/reports' });
    expect(activeFor([viaUrl], '/reports/2026')).toBe('/reports');
    // An item that hard-codes the basePath cannot match a basePath-stripped pathname.
    const withBase = item({ code: 'b', url: '/apps/template/reports' });
    expect(activeFor([withBase], '/reports')).toBeNull();
  });

  it('never matches items without a destination', () => {
    expect(activeFor([item({ code: 'x' })], '#')).toBeNull();
  });

  it('never matches an item that opens in a new tab', () => {
    const blank = item({ code: 'x', pageSlug: 'users', target: '_blank' });
    expect(activeFor([blank], '/users')).toBeNull();
  });

  it('finds a leaf inside a folder inside a GROUP section', () => {
    const menus = [
      item({ code: 'g', type: 'GROUP' }),
      item({ code: 'f', type: 'FOLDER', parentCode: 'g' }),
      item({ code: 'inv', parentCode: 'f', pageSlug: 'billing/invoices' }),
      item({ code: 'pay', parentCode: 'f', pageSlug: 'billing/payments' }),
    ];
    expect(activeFor(menus, '/billing/payments/9')).toBe('/billing/payments');
  });

  it('finds a leaf hoisted out of a folder nested two levels deep', () => {
    const menus = [
      item({ code: 'f', type: 'FOLDER' }),
      item({ code: 'sub', type: 'FOLDER', parentCode: 'f' }),
      item({ code: 'deep', parentCode: 'sub', pageSlug: 'a/b/c' }),
    ];
    expect(activeFor(menus, '/a/b/c')).toBe('/a/b/c');
  });

  it('ignores inactive items', () => {
    expect(activeFor([item({ code: 'u', pageSlug: 'users', status: 'INACTIVE' })], '/users')).toBe(
      null,
    );
  });

  it('matches an item whose pageSlug has a trailing slash', () => {
    expect(activeFor([item({ code: 'u', pageSlug: 'users/' })], '/users')).toBe('/users/');
  });

  it('matches an item whose url carries a query string', () => {
    expect(activeFor([item({ code: 'u', url: '/users?tab=1' })], '/users')).toBe('/users?tab=1');
  });

  it('lets a deeper route outrank a shorter one that only carries a long query', () => {
    const items = [
      item({ code: 'u', url: '/users?tab=permissions&sort=name' }),
      item({ code: 'l', pageSlug: 'users/list' }),
    ];
    expect(activeFor(items, '/users/list')).toBe('/users/list');
  });
});

describe('isItemActive / activeHrefWithin', () => {
  const a = item({ code: 'a', parentCode: 'f', pageSlug: 'a' });
  const b = item({ code: 'b', parentCode: 'f', pageSlug: 'b' });
  const solo = item({ code: 'solo', pageSlug: 'solo' });
  const [section] = buildMenuSections([item({ code: 'f', type: 'FOLDER' }), a, b, solo]);
  const [folder, leaf] = section!.nodes;

  it('is false when nothing is active', () => {
    expect(isItemActive(a, null)).toBe(false);
    expect(activeHrefWithin(folder!, null)).toBeNull();
  });

  it('returns the active href only for the subtree that holds it', () => {
    expect(activeHrefWithin(folder!, '/b')).toBe('/b');
    expect(activeHrefWithin(leaf!, '/b')).toBeNull();
    expect(activeHrefWithin(leaf!, '/solo')).toBe('/solo');
    expect(activeHrefWithin(folder!, '/solo')).toBeNull();
  });

  it('returns null for an empty folder', () => {
    const [s] = buildMenuSections([item({ code: 'empty', type: 'FOLDER' })]);
    expect(activeHrefWithin(s!.nodes[0]!, '/anything')).toBeNull();
  });
});
