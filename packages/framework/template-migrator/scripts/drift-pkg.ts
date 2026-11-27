// package.json field drift: the template's non-dependency fields against what
// the pkg.set steps leave behind. Without this, a new script or engine range in
// the template reaches scaffolded apps through the zip and never reaches
// upgraded ones.

import { jsonEqual, PKG_UNMANAGED_FIELDS, setPkgFields } from "../src/pkg-fields.js";

/** Script keys the zip removes before packing (create-zip-template.ps1), so no app ever has them. */
export const ZIP_STRIPPED_SCRIPTS: readonly string[] = ["publish:template"];

export interface PkgFieldDrift {
  /** `scripts.dev` for an object key, `version` for a top-level field. */
  field: string;
  /** Template value; undefined when the template does not have it. */
  template: unknown;
  /** Value after every pkg.set step; undefined when no step sets it. */
  expected: unknown;
}

/** Apply every pkg.set step, in migration order, to an empty package.json. */
export function foldPkgSteps(steps: { fields: Record<string, unknown>; replace?: string[] }[]): Record<string, unknown> {
  const pkg: Record<string, unknown> = {};
  for (const step of steps) setPkgFields(pkg, step.fields, step.replace);
  return pkg;
}

/** The template's fields a migration must carry: no identity or deps, no zip-stripped scripts. */
export function managedTemplateFields(template: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(template)) {
    if (PKG_UNMANAGED_FIELDS.includes(field)) continue;
    if (field === "scripts" && value && typeof value === "object" && !Array.isArray(value)) {
      out[field] = Object.fromEntries(
        Object.entries(value).filter(([key]) => !ZIP_STRIPPED_SCRIPTS.includes(key)),
      );
      continue;
    }
    out[field] = value;
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function findPkgFieldDrift(opts: {
  template: Record<string, unknown>;
  expected: Record<string, unknown>;
}): PkgFieldDrift[] {
  const template = managedTemplateFields(opts.template);
  const expected = opts.expected;
  const drift: PkgFieldDrift[] = [];
  const fields = [...new Set([...Object.keys(template), ...Object.keys(expected)])].sort();
  for (const field of fields) {
    const t = template[field];
    const e = expected[field];
    if (jsonEqual(t, e)) continue;
    // Name the keys of an object field (`scripts.test`), not the whole object.
    if (isPlainObject(t) && isPlainObject(e)) {
      const keys = [...new Set([...Object.keys(t), ...Object.keys(e)])].sort();
      for (const key of keys) {
        if (!jsonEqual(t[key], e[key])) drift.push({ field: `${field}.${key}`, template: t[key], expected: e[key] });
      }
      continue;
    }
    drift.push({ field, template: t, expected: e });
  }
  return drift;
}
