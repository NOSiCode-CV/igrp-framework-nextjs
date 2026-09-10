---
'@igrp/framework-next-ui': patch
---

fix(next-ui): make "Tentar novamente" actually retry in the header/sidebar error fallbacks

`IGRPLayoutErrorBoundary` latched `hasError` permanently, so the `router.refresh()`
behind the retry button re-fetched the server tree but the boundary kept rendering
`IGRPSidebarError` / `IGRPHeaderError` — the button appeared to do nothing.

The boundary now exposes a reset through context (`useIGRPLayoutErrorReset`), and
both fallbacks use the new `useIGRPLayoutRetry` hook: it refreshes inside a
transition and clears the boundary only once that transition settles, so the
boundary re-renders the freshly fetched tree instead of the failing one. The retry
button also shows a loading state while the refresh is in flight.

`useIGRPLayoutRetry` and `useIGRPLayoutErrorReset` are exported for consumers
writing their own layout error fallbacks.
