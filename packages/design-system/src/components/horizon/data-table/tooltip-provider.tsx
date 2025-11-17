import { createContext, type ReactNode } from 'react';

import { TooltipProvider } from '../../primitives/tooltip';

const DataTableTooltipContext = createContext(false);

function IGRPDataTableTooltipProvider({
  children,
  delayDuration = 200,
}: {
  children: ReactNode;
  delayDuration?: number;
}) {
  return (
    <DataTableTooltipContext.Provider value>
      <TooltipProvider delayDuration={delayDuration}>{children}</TooltipProvider>
    </DataTableTooltipContext.Provider>
  );
}

export { DataTableTooltipContext, IGRPDataTableTooltipProvider };

