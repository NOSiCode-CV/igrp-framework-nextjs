import { describe, expect, it } from 'vitest';

import { AppError, getDisplayableErrorMessage, parsePublicDigest } from '../app-error.js';

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

  it('keeps the pt-PT fallback by default', () => {
    expect(getDisplayableErrorMessage(sanitized).message).toBe(
      'Ocorreu um erro. Por favor, tente novamente.',
    );
  });
});
