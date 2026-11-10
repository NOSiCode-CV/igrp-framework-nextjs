---
"@igrp/template-migrator": patch
---

Migration 84: the demo-v1 middleware creates a CSP nonce for each request and the root layout passes it to `IGRPRootLayout`, so next-themes' theme boot script and Next.js' inline scripts carry it. Also resyncs framework-next to 0.2.0-beta.22, framework-next-ui to 0.2.0-beta.20 and the design system to 0.2.0-beta.15.
