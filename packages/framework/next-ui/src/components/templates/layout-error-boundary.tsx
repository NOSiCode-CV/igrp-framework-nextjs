'use client';

import { Component, createContext, useContext, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
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
