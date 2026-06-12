---
"@igrp/framework-next-auth": patch
---

Pluggable rotation-recovery store for multi-replica deployments. New on the `./oidc` entry: `IGRPTokenRecoveryStore`, `createInMemoryTokenRecoveryStore`, and `configureOidcTokenRecoveryStore` (globalThis-backed so all bundled module copies share one store). `withIGRPAuth` accepts a `tokenRecoveryStore` option; the shared-store implementation is consumer-supplied (no storage backend is bundled or prescribed). On a permanent refresh rejection (`invalid_grant`), the refresh now re-checks the store before flagging `RefreshAccessTokenError`, recovering sessions whose refresh token was rotated by another replica. Store failures degrade to a cache miss with a once-per-process warning. API note: `getRecoveredToken` is now async (`Promise<JWT | null>`); default behavior without the new option is unchanged (in-memory, per-process).
