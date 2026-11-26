import { describe, expect, it, vi } from 'vitest';

import {
  AppError,
  encodePublicCodeDigest,
  getDisplayableErrorMessage,
  parsePublicDigest,
} from '../app-error.js';

describe('AppError', () => {
  it('carries no message without a publicMessage, so the boundary shows its translated copy', () => {
    const { errorId, message } = parsePublicDigest(new AppError({}).digest);
    expect(errorId).toBeTruthy();
    expect(message).toBeNull();
  });

  it('carries the publicMessage when given', () => {
    expect(
      parsePublicDigest(new AppError({ publicMessage: 'Perfil indisponível.' }).digest).message,
    ).toBe('Perfil indisponível.');
  });
});

describe('parsePublicDigest', () => {
  it('reads a code-shaped public part as a code, free text as a message', () => {
    expect(parsePublicDigest('k1-ab|IGRP_CONFIG_INVALID')).toEqual({
      errorId: 'k1-ab',
      message: null,
      code: 'IGRP_CONFIG_INVALID',
    });
    expect(parsePublicDigest('k1-ab|Perfil indisponível.')).toEqual({
      errorId: 'k1-ab',
      message: 'Perfil indisponível.',
      code: null,
    });
  });

  it("returns nulls for Next's own digests", () => {
    expect(parsePublicDigest('2384712')).toEqual({ errorId: null, message: null, code: null });
    expect(parsePublicDigest(undefined)).toEqual({ errorId: null, message: null, code: null });
  });
});

describe('encodePublicCodeDigest', () => {
  it('encodes only a machine-stable code', () => {
    expect(encodePublicCodeDigest('IGRP_X_1')).toMatch(/\|IGRP_X_1$/);
    expect(encodePublicCodeDigest('Mensagem livre')).toBeUndefined();
  });
});

describe('getDisplayableErrorMessage', () => {
  const sanitized = Object.assign(
    new Error(
      'An error occurred in the Server Components render. The specific message is omitted in production builds',
    ),
    { digest: '123' },
  );

  it('falls back to the caller-supplied copy', () => {
    expect(getDisplayableErrorMessage(sanitized, 'Something went wrong.').message).toBe(
      'Something went wrong.',
    );
  });

  it('shows a raw message only outside production', () => {
    const raw = new Error('DB password rejected for host db-1');
    expect(getDisplayableErrorMessage(raw, 'fallback').message).toBe(raw.message);
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(getDisplayableErrorMessage(raw, 'fallback').message).toBe('fallback');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('keeps the pt-PT fallback by default', () => {
    expect(getDisplayableErrorMessage(sanitized).message).toBe(
      'Ocorreu um erro. Por favor, tente novamente.',
    );
  });
});
