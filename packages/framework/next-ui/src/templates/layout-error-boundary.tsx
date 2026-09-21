'use client';

import { Component, createContext, useContext, type ErrorInfo, type ReactNode } from 'react';

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

export class IGRPLayoutErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
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
