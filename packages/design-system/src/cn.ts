/**
 * Server-safe `cn` entry point: `@igrp/igrp-framework-react-design-system/cn`.
 *
 * WHY THIS FILE EXISTS
 *
 * `src/index.ts` opens with `"use client"`, so the whole root barrel is a client
 * boundary. That is correct for components, but it also captured `cn` — a pure
 * string function with no React in it. Importing `cn` from the root in a server
 * module therefore fails at runtime, not at type-check:
 *
 *   Error: Attempted to call cn() from the server but cn is on the client.
 *
 * Nothing catches that before a real build. `tsc --noEmit` passes and
 * `biome check` passes; the error only appears during Next's page-data
 * collection, after "Compiled successfully". And because a server module like
 * `src/lib/fonts.ts` is reached from the root layout, the failure lands on an
 * unrelated route.
 *
 * Until this entry existed, the design system had no way to hand `cn` to server
 * code, so the consuming rule ("always take `cn` from the design system") was
 * unsatisfiable in exactly the places that needed it most. Consumers worked
 * around it by depending on the `cn` package directly, which then floated out of
 * sync with the version pinned here.
 *
 * THIS FILE MUST NOT DECLARE "use client", AND MUST NOT IMPORT ANYTHING THAT
 * DOES. Babel emits one module per source file and preserves directives, so the
 * absence of a directive here is the whole mechanism.
 * `src/server-safe-entries.test.ts` asserts that on the built output.
 *
 * Client components may keep importing `cn` from the root barrel — it is the
 * same function, re-exported from the same `cn` package.
 */
export { cn } from "cn"
