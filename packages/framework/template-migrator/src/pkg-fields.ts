// `pkg.set`: the package.json fields that are not dependencies.
//
// deps.bump / deps.remove / deps.restore cover `dependencies` and
// `devDependencies`. Everything else in the template's package.json (scripts,
// engines, version, …) used to reach scaffolded apps through the zip and never
// reach upgraded ones. `pkg.set` carries those fields; the drift gate folds every
// `pkg.set` step with the same function to check that they match the template.

export type PkgFields = Record<string, unknown>;

/** Fields a migration never touches: the app's identity, and the deps the `deps.*` steps own. */
export const PKG_UNMANAGED_FIELDS: readonly string[] = [
  "name",
  "description",
  "displayName",
  "dependencies",
  "devDependencies",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Apply `fields` to `pkg` in place and return the fields that undo it.
 *
 * - `null` deletes the field.
 * - An object value merged onto an existing object field sets each key, and a
 *   `null` key deletes that key. Keys the app added itself (its own scripts)
 *   are kept.
 * - Any other value replaces the field. So does an object value for a field in
 *   `replace`.
 */
export function setPkgFields(
  pkg: Record<string, unknown>,
  fields: PkgFields,
  replace: readonly string[] = [],
): { fields: PkgFields; replace: string[] } {
  const undo: PkgFields = {};
  const undoReplace: string[] = [];
  for (const [field, value] of Object.entries(fields)) {
    const current = pkg[field];
    if (value === null) {
      if (current !== undefined) {
        undo[field] = current;
        undoReplace.push(field);
      }
      delete pkg[field];
      continue;
    }
    if (isPlainObject(value) && isPlainObject(current) && !replace.includes(field)) {
      const prior: Record<string, unknown> = {};
      const next = { ...current };
      for (const [key, sub] of Object.entries(value)) {
        prior[key] = key in current ? current[key] : null;
        if (sub === null) delete next[key];
        else next[key] = sub;
      }
      pkg[field] = next;
      undo[field] = prior;
      continue;
    }
    undo[field] = current === undefined ? null : current;
    if (current !== undefined) undoReplace.push(field);
    // A `null` key inside a new object means "absent": drop it.
    pkg[field] = isPlainObject(value)
      ? Object.fromEntries(Object.entries(value).filter(([, sub]) => sub !== null))
      : value;
  }
  return { fields: undo, replace: undoReplace };
}

/** Deep equality for JSON values. Object key order is ignored; array order is not. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => jsonEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && jsonEqual(a[k], b[k]));
  }
  return a === b;
}
