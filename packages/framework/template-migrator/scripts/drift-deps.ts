// Template deps no migration pins (deps.bump / deps.restore). Their range must
// equal the one grandfathered in template-baseline.json; a new dep or a moved
// range would otherwise reach scaffolded apps through the zip and never reach
// upgraded ones. `workspace:*` deps are excluded: the @igrp/* pin check covers them.

export interface UnpinnedDepDrift {
  dep: string;
  declared: string;
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
  return Object.entries(unpinnedDeps(opts.templateDeps, opts.pinned))
    .filter(([dep, declared]) => opts.baseline[dep] !== declared)
    .map(([dep, declared]) => ({ dep, declared, baseline: opts.baseline[dep] ?? null }));
}
