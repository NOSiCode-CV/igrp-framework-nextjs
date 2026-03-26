import { createContext, type ReactNode } from 'react';

import { TooltipProvider } from '../../ui/tooltip';

/** @internal Context indicating tooltip provider is present. */
const IGRPDataTableTooltipContext = createContext(false);

/**
 * Wraps data table row actions with TooltipProvider for consistent tooltip behavior.
 * Use when rendering IGRPDataTableActionTooltip or similar action buttons.
 */
function IGRPDataTableTooltipProvider({
  children,
  delayDuration = 200,
}: {
  /** Child content (e.g. row actions). */
  children: ReactNode;
  /** Tooltip delay in ms. */
  delayDuration?: number;
}) {
  return (
    <IGRPDataTableTooltipContext.Provider value>
      <TooltipProvider delayDuration={delayDuration}>{children}</TooltipProvider>
    </IGRPDataTableTooltipContext.Provider>
  );
}

export { IGRPDataTableTooltipContext, IGRPDataTableTooltipProvider };
