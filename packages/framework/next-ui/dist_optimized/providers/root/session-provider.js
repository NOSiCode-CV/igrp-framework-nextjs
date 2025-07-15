'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { SessionProvider } from 'next-auth/react';
export function IGRPSessionProvider(props) {
  return /*#__PURE__*/_jsx(SessionProvider, {
    ...props,
    refetchInterval: 4 * 60,
    children: props.children
  });
}
//# sourceMappingURL=session-provider.js.map