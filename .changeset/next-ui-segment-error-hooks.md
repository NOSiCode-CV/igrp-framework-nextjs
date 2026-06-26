---
"@igrp/framework-next-ui": patch
---

Fix a Rules-of-Hooks violation in `IGRPSegmentError`: the `children` short-circuit `return` ran before `useState`/`useEffect`, so toggling the `children` prop between renders changed the hook count and could crash the error boundary itself (the worst place to crash). Hooks now run on every render; the `children` passthrough is guarded inside the effect and returned after the hooks, mirroring `IGRPGlobalError`.
