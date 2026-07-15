// New-file ("orphan") detection for the drift gate.
//
// The content checks in check-drift.ts can only verify paths some migration
// already manages. A brand-new template file no migration ever shipped would
// otherwise pass silently — scaffolded apps get it, upgraded apps never do.
// This module closes that gap: every tracked template file must be either
// migration-managed, exempt, or explicitly grandfathered in the baseline
// (migrations/demo-v1/template-baseline.json). Anything else is an orphan.

/**
 * Directory prefixes exempt from the new-file check.
 * Two categories:
 * - never ship to consumers (excluded from the template zip),
 * - ship in the zip but are docs/AI-tooling content, not app runtime code —
 *   an upgraded app missing them behaves identically to a scaffolded one.
 */
export const TEMPLATE_EXEMPT_PREFIXES: string[] = [
  // zip-excluded — never reaches consumers
  "create-template/",
  "node_modules/",
  ".next/",
  ".git/",
  "superpowers/",
  // docs / AI-tooling content — ships in the zip, but not runtime code
  "docs/",
  "specs/",
  ".github/",
  ".cursor/",
  ".trae/",
];

/** Exact-path exemptions, same rationale as TEMPLATE_EXEMPT_PREFIXES. */
export const TEMPLATE_EXEMPT_FILES: string[] = [
  // zip-excluded — never reaches consumers
  "CHANGELOG.md",
  "CLAUDE.md",
  "igrp-next-template.zip",
  // AI bridge file, same category as .cursor/.trae rules
  "AGENTS.md",
  // migration state, written by the CLI itself in consumer apps
  ".igrp-migrations-lock.json",
];

export interface OrphanReport {
  /** Template files no migration ships and the baseline doesn't grandfather. */
  orphans: string[];
  /** Baseline entries the template no longer has (and no migration manages). */
  staleBaseline: string[];
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function isExempt(path: string, prefixes: string[], files: string[]): boolean {
  return files.includes(path) || prefixes.some((prefix) => path.startsWith(prefix));
}

export function findOrphanFiles(opts: {
  templateFiles: string[];
  managedPaths: Iterable<string>;
  baseline: string[];
  exemptPrefixes?: string[];
  exemptFiles?: string[];
}): OrphanReport {
  const prefixes = (opts.exemptPrefixes ?? TEMPLATE_EXEMPT_PREFIXES).map(toPosix);
  const files = (opts.exemptFiles ?? TEMPLATE_EXEMPT_FILES).map(toPosix);
  const managed = new Set([...opts.managedPaths].map(toPosix));
  const baseline = new Set(opts.baseline.map(toPosix));
  const template = new Set(opts.templateFiles.map(toPosix));

  const orphans = [...template]
    .filter((p) => !managed.has(p) && !baseline.has(p) && !isExempt(p, prefixes, files))
    .sort();

  const staleBaseline = [...baseline].filter((p) => !template.has(p) && !managed.has(p)).sort();

  return { orphans, staleBaseline };
}
