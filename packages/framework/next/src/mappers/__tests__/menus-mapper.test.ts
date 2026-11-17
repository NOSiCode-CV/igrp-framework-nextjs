import { describe, expect, it } from 'vitest';
import {
  MenuType,
  Status,
  type ApiResponse,
  type MenuEntryDTO,
} from '@igrp/platform-access-management-client-ts';

import { mapperMenus } from '../menus-mapper.js';

const dto: MenuEntryDTO = {
  id: 1,
  code: 'M1',
  name: 'Menu 1',
  type: MenuType.MENU_PAGE,
  position: 0,
  icon: 'Home',
  status: Status.ACTIVE,
  target: '_self' as MenuEntryDTO['target'],
  url: '/home',
  pageSlug: 'home',
  applicationCode: 'APP_A',
  roles: [],
  parentCode: null,
  createdBy: 'admin',
  createdDate: '2026-01-01',
  lastModifiedBy: 'admin2',
  lastModifiedDate: '2026-01-02',
};

const wrap = (data: MenuEntryDTO[] | null | undefined) =>
  ({ data, status: 200, statusText: 'OK' }) as ApiResponse<MenuEntryDTO[]>;

describe('mapperMenus', () => {
  it.each([
    ['null data', null],
    ['undefined data', undefined],
    ['an empty array', []],
  ])('returns [] for %s', (_, data) => {
    expect(mapperMenus(wrap(data))).toEqual([]);
  });

  it('forwards exactly the declared fields', () => {
    expect(mapperMenus(wrap([dto]))).toEqual([
      {
        id: 1,
        code: 'M1',
        name: 'Menu 1',
        type: MenuType.MENU_PAGE,
        position: 0,
        icon: 'Home',
        status: Status.ACTIVE,
        target: '_self',
        url: '/home',
        pageSlug: 'home',
        applicationCode: 'APP_A',
        roles: [],
        parentCode: null,
      },
    ]);
  });

  it.each(['createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'])(
    'does not forward audit field `%s`',
    (field) => {
      const [mapped] = mapperMenus(wrap([dto]));
      expect(mapped).not.toHaveProperty(field);
    },
  );

  it.each([
    ['empty', ''],
    ['missing', undefined],
  ])('normalises a %s icon to undefined', (_, icon) => {
    const [mapped] = mapperMenus(wrap([{ ...dto, icon }]));
    expect(mapped!.icon).toBeUndefined();
  });

  it('passes null url / pageSlug / parentCode and a missing id through', () => {
    const [mapped] = mapperMenus(
      wrap([{ ...dto, url: null, pageSlug: null, parentCode: null, id: undefined }]),
    );
    expect(mapped).toMatchObject({ url: null, pageSlug: null, parentCode: null, id: undefined });
  });

  it('keeps nesting via parentCode and preserves order', () => {
    const child = { ...dto, id: 2, code: 'M2', parentCode: 'M1' };
    const mapped = mapperMenus(wrap([dto, child]));

    expect(mapped.map((m) => [m.code, m.parentCode])).toEqual([
      ['M1', null],
      ['M2', 'M1'],
    ]);
  });
});
