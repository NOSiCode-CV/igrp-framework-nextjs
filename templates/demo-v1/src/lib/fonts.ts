import { Geist, Geist_Mono, Inter, Mulish } from "next/font/google";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontMullish = Mulish({
  subsets: ["latin"],
  variable: "--font-mullish",
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/**
 * Deliberately a plain join, not `cn()`.
 *
 * These four values are `next/font` CSS-variable class names — opaque generated
 * identifiers like `__variable_1e4310`. There is no Tailwind utility among them,
 * so there is nothing for tailwind-merge to resolve and nothing conditional for
 * clsx to drop: `cn()` would do strictly more work to produce the same string.
 *
 * It also has to be a plain join. This module is reached from
 * `igrp.template.config.ts` → `app/layout.tsx`, so it is server code, and it
 * runs at MODULE SCOPE. Calling a function exported from the design system's
 * root barrel here throws at build time — the barrel is a `"use client"`
 * boundary:
 *
 *   Error: Attempted to call cn() from the server but cn is on the client.
 *
 * Neither `tsc` nor Biome sees that; only a real `next build` does, and it
 * reports the failure against whichever route pulled the root layout in first.
 * If you ever do need real class merging in a server module, import from the
 * design system's server-safe entry — `@igrp/igrp-framework-react-design-system/cn`
 * — never from its root.
 */
export const fontVariables = [
  fontSans.variable,
  fontMono.variable,
  fontMullish.variable,
  fontInter.variable,
].join(" ");
