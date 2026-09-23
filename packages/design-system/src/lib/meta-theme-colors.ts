/**
 * Theme colors for the `<meta name="theme-color">` tag (browser chrome).
 *
 * Deliberately in its own module WITHOUT "use client": server code reads it —
 * e.g. a root layout's `viewport.themeColor`. Exported from a "use client"
 * module, a server import receives a client-reference stub, so
 * `IGRP_META_THEME_COLORS.light` is silently `undefined` and Next drops the tag.
 */
export const IGRP_META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
}
