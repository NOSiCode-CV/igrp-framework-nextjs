import { describe, expect, it } from 'vitest';
import {
  Status,
  type ApiResponse,
  type ApplicationDTO,
  type ApplicationType,
} from '@igrp/platform-access-management-client-ts';

import { mapperApplications } from '../applications-mapper.js';

const dto: ApplicationDTO = {
  id: 1,
  code: 'APP_A',
  name: 'App A',
  description: 'desc',
  status: Status.ACTIVE,
  type: 'INTERNAL' as ApplicationType,
  owner: 'owner',
  picture: 'https://example.cv/a.png',
  url: 'https://a.example.cv',
  slug: 'app-a',
  departments: ['D1'],
  createdBy: 'admin',
  createdDate: '2026-01-01',
  lastModifiedBy: 'admin2',
  lastModifiedDate: '2026-01-02',
  lastAccess: '2026-01-03',
};

const wrap = (data: ApplicationDTO[] | null | undefined) =>
  ({ data, status: 200, statusText: 'OK' }) as ApiResponse<ApplicationDTO[]>;

describe('mapperApplications', () => {
  it.each([
    ['null data', null],
    ['undefined data', undefined],
    ['an empty array', []],
  ])('returns [] for %s', (_, data) => {
    expect(mapperApplications(wrap(data))).toEqual([]);
  });

  it('maps every field of a fully populated DTO', () => {
    expect(mapperApplications(wrap([dto]))).toEqual([dto]);
  });

  it('returns fresh objects, not the DTOs', () => {
    expect(mapperApplications(wrap([dto]))[0]).not.toBe(dto);
  });

  it.each([
    'owner',
    'url',
    'slug',
    'createdBy',
    'createdDate',
    'lastModifiedBy',
    'lastModifiedDate',
    'lastAccess',
  ] as const)('normalises an empty or null `%s` to undefined', (field) => {
    for (const value of ['', null]) {
      const [mapped] = mapperApplications(wrap([{ ...dto, [field]: value } as ApplicationDTO]));
      expect(mapped![field]).toBeUndefined();
    }
  });

  it.each([
    ['picture', null],
    ['description', null],
    ['departments', []],
  ] as const)('passes `%s` through unchanged (%j)', (field, value) => {
    const [mapped] = mapperApplications(wrap([{ ...dto, [field]: value } as ApplicationDTO]));
    expect(mapped![field]).toEqual(value);
  });

  it('preserves order across multiple applications', () => {
    const mapped = mapperApplications(wrap([dto, { ...dto, id: 2, code: 'APP_B' }]));
    expect(mapped.map((a) => a.code)).toEqual(['APP_A', 'APP_B']);
  });
});
