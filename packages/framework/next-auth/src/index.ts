// ─────────────────────────────────────────────────────────────────────────────
// @igrp/framework-next-auth — root barrel
//
// IMPORTANT: This barrel is intentionally Edge-safe. It re-exports ONLY
// isomorphic modules (pure utilities + type modules). Consumers that need
// Node-only server helpers (cookies, getServerSession) or the `withIGRPAuth`
// factory MUST import the dedicated subpath entries:
//
//   import { withIGRPAuth }         from '@igrp/framework-next-auth/config';
//   import { getServerSessionStrict } from '@igrp/framework-next-auth/server';
//
// Re-exporting `./server` or `./config` here would drag `next/headers` and the
// `next-auth` root module into the Edge bundle via the barrel, which breaks
// the template middleware under Next.js + Turbopack/webpack.
// ─────────────────────────────────────────────────────────────────────────────

export * from './session';
export * from './jwt';
export * from './middleware';
export * from './providers';
export * from './oidc';
export * from './sanitize';
