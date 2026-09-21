import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'tsup';

/**
 * Entries that must ship a `"use client"` directive.
 *
 * esbuild drops module-level directives when bundling, so a `'use client'` in
 * `src/client.ts` cannot survive on its own — and `next-auth`'s own CJS `react`
 * entry has never carried one. Without the directive,
 * `@igrp/framework-next-auth/client` is a server-first module and importing
 * `SessionProvider` / `useSafeSession` from a file that isn't already a client
 * component fails at render.
 *
 * This hook is therefore the ONLY place the directive comes from; `src/client.ts`
 * deliberately does not declare it, because doing so only re-triggered the
 * "Module level directives cause errors when bundled … was ignored" warning on
 * every build without changing the output. `clean: true` means this always runs
 * against fresh output.
 *
 * `src/__tests__/dist-contract.test.ts` asserts the directive on the real build,
 * which is what keeps this honest — including if someone later swaps this hook
 * for a directive-preserving plugin, where the absent source directive would
 * otherwise ship a silently server-first entry.
 */
const CLIENT_ENTRIES = ['client.js'];

async function ensureUseClientDirective() {
  for (const file of CLIENT_ENTRIES) {
    const target = path.join('dist', file);
    const source = await readFile(target, 'utf8');
    if (source.startsWith('"use client"') || source.startsWith("'use client'")) continue;
    await writeFile(target, `"use client";\n${source}`, 'utf8');
  }
}

export default defineConfig({
  onSuccess: ensureUseClientDirective,
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    session: 'src/session.ts',
    jwt: 'src/jwt.ts',
    middleware: 'src/middleware.ts',
    config: 'src/config.ts',
    oidc: 'src/oidc.ts',
    providers: 'src/providers.ts',
    sanitize: 'src/sanitize.ts',
    types: 'src/types.ts',
    claims: 'src/claims.ts',
    cookies: 'src/cookies.ts',
    runtime: 'src/runtime.ts',
  },
  format: ['esm'],
  dts: {
    compilerOptions: {
      // tsconfig.json is type-check-only (noEmit, non-composite). The dts pass
      // reads it, so both have to be overridden here or the build silently
      // ships no .d.ts at all — `dist-contract.test.ts` is what catches that.
      noEmit: false,
      composite: false,
      incremental: false,
      ignoreDeprecations: '6.0',
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2022',
  platform: 'neutral',
  skipNodeModulesBundle: true,
  external: [
    'react',
    'next',
    'next/server',
    'next/headers',
    'next/navigation',
    'next-auth',
    'next-auth/react',
    'next-auth/middleware',
    'next-auth/jwt',
    'next-auth/providers/oauth',
    'next-auth/providers/keycloak',
  ],
});
