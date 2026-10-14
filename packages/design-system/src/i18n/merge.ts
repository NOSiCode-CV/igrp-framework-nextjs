import type { IGRPI18nStrings, IGRPI18nStringsOverride } from "./strings.js"

/**
 * Merges `override` over `base`, group by group, key by key.
 *
 * Generic over the groups of `base`, so adding a group to `IGRPI18nStrings`
 * needs no change here (the provider used to list all 28 groups by hand).
 * Groups unknown to `base` are dropped; `undefined` leaves keep the base
 * value; neither input is mutated. Without an override the base is returned
 * as-is, so the provider's `useMemo` identity is stable.
 */
export function igrpMergeI18nStrings(
  base: IGRPI18nStrings,
  override?: IGRPI18nStrings | IGRPI18nStringsOverride
): IGRPI18nStrings {
  if (!override) return base
  const result = { ...base } as Record<string, Record<string, string>>
  for (const group of Object.keys(base) as (keyof IGRPI18nStrings)[]) {
    const patch = (override as Record<string, Record<string, string | undefined> | undefined>)[group]
    if (!patch) continue
    const merged: Record<string, string> = { ...base[group] }
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value === "string") merged[key] = value
    }
    result[group] = merged
  }
  return result as unknown as IGRPI18nStrings
}
