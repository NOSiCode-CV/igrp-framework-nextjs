import { describe, it, expect, vi } from 'vitest';

/**
 * The layout slots (`header`, `sidebar`) render framework data providers that
 * call `redirect('/login')` on a 401/403 from Access Management. `redirect`
 * signals by THROWING, and the provider sits behind a `<Suspense>` nested in
 * this boundary — so the throw is streamed to the client, where this boundary
 * is nearer than Next's own `RedirectBoundary` and latched first. The user with
 * an expired session got a permanently broken header and sidebar instead of the
 * login page.
 *
 * These exercise the boundary's decision directly (the statics are pure), which
 * keeps the test independent of a DOM renderer.
 */

const { IGRPLayoutErrorBoundary } = await import('../layout-error-boundary.js');

/** Shape Next gives a thrown `redirect()`. */
const redirectError = Object.assign(new Error('NEXT_REDIRECT'), {
  digest: 'NEXT_REDIRECT;replace;/login;307;',
});
/** Shape Next gives a thrown `notFound()`. */
const notFoundError = Object.assign(new Error('NEXT_NOT_FOUND'), {
  digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
});

describe('IGRPLayoutErrorBoundary does not swallow Next control flow', () => {
  it('rethrows a redirect instead of latching', () => {
    expect(() => IGRPLayoutErrorBoundary.getDerivedStateFromError(redirectError)).toThrow(
      redirectError,
    );
  });

  it('rethrows an HTTP-fallback signal (notFound / forbidden / unauthorized)', () => {
    expect(() => IGRPLayoutErrorBoundary.getDerivedStateFromError(notFoundError)).toThrow(
      notFoundError,
    );
  });

  it('still latches on a genuine failure', () => {
    expect(IGRPLayoutErrorBoundary.getDerivedStateFromError(new Error('AM 500'))).toEqual({
      hasError: true,
    });
  });

  it('componentDidCatch rethrows control flow rather than reporting it', () => {
    const onError = vi.fn();
    const instance = new IGRPLayoutErrorBoundary({
      fallback: null,
      children: null,
      onError,
    });

    expect(() =>
      instance.componentDidCatch(redirectError, { componentStack: '' } as never),
    ).toThrow(redirectError);
    expect(onError).not.toHaveBeenCalled();

    const failure = new Error('AM 500');
    instance.componentDidCatch(failure, { componentStack: '' } as never);
    expect(onError).toHaveBeenCalledWith(failure, expect.anything());
  });
});
