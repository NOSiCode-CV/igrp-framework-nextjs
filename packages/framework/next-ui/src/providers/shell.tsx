'use client';

import { createContext, use } from 'react';

/**
 * Whether the surrounding layout renders a sidebar. Set by
 * `IGRPRootProvidersFull`; `undefined` outside it (a header mounted on its own
 * keeps its trigger, as before).
 */
const ShellContext = createContext<{ hasSidebar: boolean } | undefined>(undefined);

export function IGRPShellProvider({
  hasSidebar,
  children,
}: {
  hasSidebar: boolean;
  children: React.ReactNode;
}) {
  return <ShellContext value={{ hasSidebar }}>{children}</ShellContext>;
}

/** `false` only when the layout says it has no sidebar. */
export function useIGRPHasSidebar(): boolean {
  return use(ShellContext)?.hasSidebar ?? true;
}
