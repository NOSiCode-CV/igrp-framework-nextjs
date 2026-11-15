// Template deps no migration pins (deps.bump / deps.restore). Their range must
// equal the one grandfathered in template-baseline.json; a new dep or a moved
// range would otherwise reach scaffolded apps through the zip and never reach
// upgraded ones. `workspace:*` deps are excluded: the @igrp/* pin check covers them.

export interface UnpinnedDepDrift {
  dep: string;
  /** Template range, or null when the template no longer declares a baselined dep at all. */
  declared: string | null;
  /** Grandfathered range, or null when the dep is not in the baseline at all. */
  baseline: string | null;
}

/** Unpinned, non-workspace template deps, as the baseline would record them. */
export function unpinnedDeps(templateDeps: Record<string, string>, pinned: Set<string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(templateDeps)
      .filter(([dep, range]) => range !== "workspace:*" && !pinned.has(dep))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function findUnpinnedDepDrift(opts: {
  templateDeps: Record<string, string>;
  pinned: Set<string>;
  baseline: Record<string, string>;
}): UnpinnedDepDrift[] {
  const declared = unpinnedDeps(opts.templateDeps, opts.pinned);
  // Baseline keys the template dropped entirely are stale. One a migration now
  // pins is still declared, just covered by the pin check instead; a pinned one
  // the template dropped is reported by the pin check, not twice here.
  const removed = Object.keys(opts.baseline).filter((dep) => !(dep in opts.templateDeps) && !opts.pinned.has(dep));
  const deps = [...Object.keys(declared), ...removed].sort((a, b) => a.localeCompare(b));
  return deps
    .filter((dep) => opts.baseline[dep] !== declared[dep])
    .map((dep) => ({ dep, declared: declared[dep] ?? null, baseline: opts.baseline[dep] ?? null }));
}
