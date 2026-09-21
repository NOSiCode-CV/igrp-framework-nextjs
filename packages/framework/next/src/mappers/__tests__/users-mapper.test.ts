import { describe, expect, it } from 'vitest';
import { Status, type IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

import { mapUserDTO, mapperUser } from '../users-mapper.js';

/**
 * `mapUserDTO` is a privacy boundary: its result reaches `'use client'`
 * components through `IGRPHeaderDataArgs.user` / `IGRPSidebarDataArgs.user`,
 * so it is serialized into the RSC payload and delivered to the browser.
 *
 * The compiler cannot defend this on its own — `IGRPUserDTO` is assignable to
 * `IGRPUserArgs` (the `next-types` contract gate asserts exactly that), and a
 * variable gets no excess-property check. `fetchCurrentUser` returned
 * `result.data` for that reason and shipped the whole DTO. These tests are the
 * check the type system structurally cannot make.
 */
const dto: IGRPUserDTO = {
  id: 'u-1',
  name: 'Ana Silva',
  username: 'ana.silva',
  email: 'ana.silva@example.cv',
  status: Status.ACTIVE,
  picture: 'https://example.cv/a.png',
  signature: 'sig',
  nic: '1234567890123',
  phoneNumber: '+2385551234',
  emailVerified: true,
  metadata: { internalRiskScore: 42, ssoSubject: 'abc-123' },
};

describe('mapUserDTO', () => {
  it.each(['metadata', 'nic', 'phoneNumber', 'emailVerified'])(
    'does not forward `%s` to the client-facing shape',
    (field) => {
      const mapped = mapUserDTO(dto);

      expect(mapped).not.toHaveProperty(field);
      // Serialization is what actually crosses the boundary — assert on that
      // too, so an own-but-undefined key cannot slip through as `"nic":null`.
      expect(JSON.stringify(mapped)).not.toContain(field);
    },
  );

  it('does not leak the contents of the server-owned metadata bag', () => {
    expect(JSON.stringify(mapUserDTO(dto))).not.toContain('internalRiskScore');
  });

  it('forwards exactly the declared fields', () => {
    expect(mapUserDTO(dto)).toEqual({
      id: 'u-1',
      name: 'Ana Silva',
      username: 'ana.silva',
      email: 'ana.silva@example.cv',
      status: Status.ACTIVE,
      picture: 'https://example.cv/a.png',
      signature: 'sig',
    });
  });

  it('is a fresh object, not the DTO passed through', () => {
    expect(mapUserDTO(dto)).not.toBe(dto);
  });

  it('withholds excluded fields even when the DTO populates them with null', () => {
    const mapped = mapUserDTO({ ...dto, nic: null, phoneNumber: null });

    expect(mapped).not.toHaveProperty('nic');
    expect(mapped).not.toHaveProperty('phoneNumber');
  });
});

describe('mapperUser', () => {
  it('narrows the response payload the same way', () => {
    const mapped = mapperUser({ data: dto, status: 200, statusText: 'OK' });

    expect(mapped).not.toHaveProperty('metadata');
    expect(mapped).not.toHaveProperty('nic');
    expect(mapped.id).toBe('u-1');
  });

  it('throws on an empty payload instead of fabricating a user', () => {
    expect(() =>
      mapperUser({ data: undefined as unknown as IGRPUserDTO, status: 200, statusText: 'OK' }),
    ).toThrow(/não foi encontrado/);
  });
});
