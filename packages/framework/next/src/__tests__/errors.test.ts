import { createFlightReactServerErrorHandler } from 'next/dist/server/app-render/create-error-handler.js';
import { describe, expect, it } from 'vitest';

import {
  IgrpAuthConfigError,
  IgrpConfigError,
  IgrpError,
  IgrpLayoutDataError,
  isIgrpError,
} from '../errors.js';
import { parsePublicDigest } from '../app-error.js';

describe('IgrpError hierarchy', () => {
  it.each([
    ['IgrpError', (c: string) => new IgrpError(c)],
    ['IgrpConfigError', (c: string) => new IgrpConfigError(c)],
    ['IgrpAuthConfigError', (c: string) => new IgrpAuthConfigError(c)],
    ['IgrpLayoutDataError', (c: string) => new IgrpLayoutDataError(c)],
  ])('%s sets its own name, the code, and falls back to the code as message', (name, make) => {
    const error = make('IGRP_CONFIG_INVALID');

    expect(error.name).toBe(name);
    expect(error.code).toBe('IGRP_CONFIG_INVALID');
    expect(error.message).toBe('IGRP_CONFIG_INVALID');
    expect(error.context).toBeUndefined();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(IgrpError);
  });

  it('keeps subclass identity for instanceof', () => {
    const error = new IgrpLayoutDataError('IGRP_LAYOUT_DATA_FAILED');

    expect(error).toBeInstanceOf(IgrpLayoutDataError);
    expect(error).not.toBeInstanceOf(IgrpConfigError);
    expect(Object.getPrototypeOf(error)).toBe(IgrpLayoutDataError.prototype);
  });

  it('uses an explicit message and context when given', () => {
    const error = new IgrpConfigError('IGRP_APP_CODE_MISSING', 'falta appCode', {
      field: 'appCode',
      attempt: 1,
      strict: true,
      hint: null,
    });

    expect(error.message).toBe('falta appCode');
    expect(error.context).toEqual({ field: 'appCode', attempt: 1, strict: true, hint: null });
  });

  it.each([
    ['IgrpError', (cause: unknown) => new IgrpError('X', 'm', undefined, { cause })],
    [
      'IgrpLayoutDataError',
      (cause: unknown) => new IgrpLayoutDataError('IGRP_LAYOUT_DATA_FAILED', 'm', {}, { cause }),
    ],
  ])('%s forwards `cause` without putting it in the context', (_, make) => {
    const cause = new Error('transport down');
    const error = make(cause);

    expect(error.cause).toBe(cause);
    expect(JSON.stringify(error.context ?? {})).not.toContain('transport down');
  });

  it('serialises to name + code + context; message, stack and cause stay off the wire', () => {
    const error = new IgrpLayoutDataError(
      'IGRP_LAYOUT_DATA_FAILED',
      'segredo interno',
      { source: 'menus' },
      { cause: new Error('token=abc') },
    );

    expect(JSON.parse(JSON.stringify(error))).toEqual({
      name: 'IgrpLayoutDataError',
      code: 'IGRP_LAYOUT_DATA_FAILED',
      context: { source: 'menus' },
      digest: expect.stringMatching(/\|IGRP_LAYOUT_DATA_FAILED$/),
    });
  });
});

describe('IgrpError digest', () => {
  it('carries <id>|<code> and nothing else, so the code survives production', () => {
    const error = new IgrpConfigError('IGRP_APP_HOME_SLUG_INVALID', 'segredo "x"', {
      receivedValue: 'x',
    });

    expect(error.digest).toMatch(/^[a-z0-9]+-[a-z0-9]+\|IGRP_APP_HOME_SLUG_INVALID$/);
    expect(parsePublicDigest(error.digest)).toEqual({
      errorId: expect.any(String),
      message: null,
      code: 'IGRP_APP_HOME_SLUG_INVALID',
    });
  });

  it('gives each instance its own correlation id', () => {
    expect(new IgrpError('IGRP_CONFIG_INVALID').digest).not.toBe(
      new IgrpError('IGRP_CONFIG_INVALID').digest,
    );
  });

  it.each(['lower_case', 'Has space', 'IGRP-DASH', 'IGRP|PIPE', ''])(
    'sets no digest for the non-stable code %j',
    (code) => {
      expect(new IgrpError(code).digest).toBeUndefined();
    },
  );

  it("is the digest Next 15's RSC error handler sends to the client", () => {
    // Next keeps a digest the error already has (create-error-handler.ts).
    const error = new IgrpConfigError('IGRP_CONFIG_INVALID', 'segredo');
    const handler = createFlightReactServerErrorHandler(false, () => {});

    expect(handler(error)).toBe(error.digest);
  });
});

describe('isIgrpError', () => {
  it.each([
    ['an IgrpError instance', new IgrpError('X'), true],
    ['a subclass instance', new IgrpConfigError('IGRP_CONFIG_INVALID'), true],
    ['a plain object after RSC serialisation', { name: 'IgrpConfigError', code: 'C' }, true],
    ['a consumer subclass name', { name: 'IgrpCustomError', code: 'C' }, true],
    ['a plain Error', new Error('boom'), false],
    ['a non-Igrp name with a code', { name: 'ApiClientError', code: 'C' }, false],
    ['an Igrp name without a code', { name: 'IgrpError' }, false],
    ['a numeric code', { name: 'IgrpError', code: 500 }, false],
    ['a non-string name', { name: 1, code: 'C' }, false],
    ['null', null, false],
    ['undefined', undefined, false],
    ['a string', 'IgrpError', false],
    ['a number', 42, false],
  ])('%s → %s', (_, value, expected) => {
    expect(isIgrpError(value)).toBe(expected);
  });
});
