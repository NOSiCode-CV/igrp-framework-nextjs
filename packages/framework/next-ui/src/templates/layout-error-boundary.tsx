'use client';

import { Component, createContext, useContext, type ErrorInfo, type ReactNode } from 'react';
import { unstable_rethrow } from 'next/navigation';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
  /**
   * Reporting hook, called once per caught error with React's component stack.
   *
   * Without it this boundary was a black hole: it rendered `fallback` and
   * dropped the error entirely — no `console.error`, no stack, nothing for an
   * observability tool to attach to. The App Router's own `error.tsx` at least
   * receives the error; a layout slot failing here left no trace at all.
   * Templates should pass their reporter (Sentry, etc.); the default logs.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

/**
 * Lets the rendered `fallback` clear the boundary's latched error.
 *
 * Without it a fallback's "retry" can only re-fetch the server tree — the
 * boundary would stay in its error state and keep rendering the fallback, so
 * the button appears to do nothing. `null` when read outside a boundary.
 */
const IGRPLayoutErrorResetContext = createContext<(() => void) | null>(null);

function useIGRPLayoutErrorReset() {
  return useContext(IGRPLayoutErrorResetContext);
}

/**
 * Error boundary for a layout slot (header / sidebar).
 *
 * **It must never latch on a Next.js control-flow signal.** `redirect()`,
 * `notFound()`, `forbidden()` and `unauthorized()` all work by throwing. The
 * framework's data providers (`@igrp/framework-next`'s header/sidebar
 * providers) call `redirect('/login')` on a 401/403 from Access Management,
 * and they render inside a `<Suspense>` nested in this boundary — so the throw
 * is streamed to the client, where THIS boundary is nearer than Next's own
 * `RedirectBoundary` and would latch first. The user with an expired session
 * then sees a permanently broken header/sidebar instead of being sent to the
 * login page.
 *
 * `unstable_rethrow` is Next's supported predicate for "this is control flow,
 * not a failure": it re-throws those and returns for everything else. Both
 * `getDerivedStateFromError` and `componentDidCatch` are guarded, because
 * React calls them independently.
 */
export class IGRPLayoutErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    unstable_rethrow(error);
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    unstable_rethrow(error);
    if (this.props.onError) {
      this.props.onError(error, info);
      return;
    }
    console.error('[IGRPLayoutErrorBoundary]', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <IGRPLayoutErrorResetContext.Provider value={this.reset}>
          {this.props.fallback}
        </IGRPLayoutErrorResetContext.Provider>
      );
    }

    return this.props.children;
  }
}

export { useIGRPLayoutErrorReset };
