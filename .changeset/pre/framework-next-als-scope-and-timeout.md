---
'@igrp/framework-next': patch
---

Add a scoped access-client config API, honour the configured timeout in Server
Actions, and pin the `async_hooks` import to the builtin.

- **`igrpWithAccessClientConfig(config, fn)`** (new). `igrpSetAccessClientConfig`
  updates the store in place via `Object.assign` when one already exists, and
  that object belongs to the async context that created it — normally the
  layout, for the whole request. A nested "use a different token for this one
  call" therefore did not nest: it overwrote the caller's token and every later
  call in the request kept using it. `igrpResetAccessClientConfig` had the same
  shape, blanking the enclosing context's token. The new helper runs the
  callback in its own `AsyncLocalStorage#run` scope over a **copy** of the
  current config, so the write cannot escape. Existing callers are unaffected.

- **`IGRP_ACCESS_MANAGEMENT_TIMEOUT`** (new, optional). `apiManagementConfig.timeout`
  only reaches the store down the layout path, which threads it explicitly into
  the data providers. A Server Action or Route Handler runs in a fresh async
  context and never sees the config object, so `igrpEnsureAccessClientConfig`
  rebuilds the store from the environment — it already did this for `baseUrl`
  via `IGRP_ACCESS_MANAGEMENT_API`, but had no timeout equivalent, leaving every
  action on the 10s default. This is the same "dead config" defect already fixed
  once on the read path. A malformed or non-positive value falls back to 10s
  rather than producing an `AbortSignal` that fires immediately or never.

- **`node:async_hooks`** instead of bare `async_hooks`. A bare specifier is a
  valid npm package name, so it can be shadowed by anything that installs one,
  and Next's Edge runtime only exposes the builtin under the prefixed form.
