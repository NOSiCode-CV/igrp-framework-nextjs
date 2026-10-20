/**
 * Server-safe `cn` entry point: `@igrp/igrp-framework-react-design-system/cn`.
 *
 * WHY THIS FILE EXISTS
 *
 * It gives server code a way to import `cn` that loads nothing else from the
 * package. The root barrel re-exports the whole design system; this entry is a
 * single module.
 *
 * It was created for a harder reason. Through 0.1.0-beta.146 `src/index.ts`
 * opened with `"use client"`, so the whole root barrel was a client boundary
 * and captured `cn` — a pure string function with no React in it. Calling `cn`
 * from the root in a server module failed at runtime, not at type-check:
 *
 *   Error: Attempted to call cn() from the server but cn is on the client.
 *
 * Nothing caught that before a real build, and it landed on an unrelated route.
 * The barrel no longer carries the directive (see the header of `src/index.ts`),
 * so the root now works on the server too, but consumers on older versions, and
 * every doc written for them, point server code here. Keep it.
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
