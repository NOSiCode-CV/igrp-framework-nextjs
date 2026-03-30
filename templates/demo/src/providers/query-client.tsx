"use client";

import { memo, type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function IGRPQueryProviderInner({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/** React Query provider with 5min stale time. Memoized to avoid unnecessary re-renders. */
export const IGRPQueryProvider = memo(IGRPQueryProviderInner);
