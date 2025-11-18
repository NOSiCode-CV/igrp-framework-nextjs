import { createContext, type ReactNode } from 'react';

import { TooltipProvider } from '../../primitives/tooltip';

const IGRPDataTableTooltipContext = createContext(false);

function IGRPDataTableTooltipProvider({
  children,
  delayDuration = 200,
}: {
  children: ReactNode;
  delayDuration?: number;
}) {
  return (
    <IGRPDataTableTooltipContext.Provider value>
      <TooltipProvider delayDuration={delayDuration}>{children}</TooltipProvider>
    </IGRPDataTableTooltipContext.Provider>
  );
}

export { IGRPDataTableTooltipContext, IGRPDataTableTooltipProvider };
