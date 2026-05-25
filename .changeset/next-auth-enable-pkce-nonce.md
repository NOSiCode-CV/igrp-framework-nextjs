---
"@igrp/framework-next-auth": patch
---

Enable PKCE (RFC 7636, S256) and OIDC `nonce` validation on the `igrp-auth` provider in addition to the existing `state` check. PKCE protects the authorization-code exchange against code-interception even when the client_secret is confidential; `nonce` prevents id_token replay (CWE-294) given the provider already opts into `idToken: true`. The change touches only the `/authorize` → `/callback` exchange owned by NextAuth — refresh, revocation, and introspection are unaffected. Spring Authorization Server (the default IGRP IdP) accepts PKCE on confidential clients without server-side configuration. Deployments behind reverse proxies that rewrite paths between authorize and callback may observe `PKCE_ERROR`; this is the same class of failure that already affected the `state` cookie and is rooted in `NEXTAUTH_URL` / proxy stability rather than the OAuth client config.
