export interface EnvKeySpec {
  default?: string;
  doc: string;
  required_if?: string;
}

export type MigrationStep =
  | { type: "file.create"; path: string; from: string }
  | { type: "file.write"; path: string; mode: "replace" | "patch"; from?: string; patch?: string }
  | { type: "file.delete"; path: string }
  | { type: "env.add"; file: string; keys: Record<string, EnvKeySpec> }
  | { type: "env.remove"; file: string; keys: string[] }
  | { type: "deps.bump"; manifest: string; ranges: Record<string, string> }
  | { type: "deps.remove"; manifest: string; deps: string[] }
  // Undo of deps.remove. `deps.bump` cannot serve as the inverse: it only
  // updates a dependency that is already declared and will not re-add one.
  // Carries the original field so a devDependency is restored as a
  // devDependency rather than promoted into `dependencies`. Also authored to
  // add a new dep; a dep the app already declares keeps its range.
  | {
      type: "deps.restore";
      manifest: string;
      removed: Record<string, { field: "dependencies" | "devDependencies"; range: string }>;
    };

export interface MigrationEntry {
  id: string;
  date: string;
  requires: string[];
  targetFrameworkVersion: string | null;
  steps: MigrationStep[];
  guideHref: string;
  contentHash: string;
  /** Hash of the step payloads (hashPayloads); absent in manifests packed before it existed. */
  payloadHash?: string;
}

export interface Manifest {
  version: 1;
  cliVersion: string;
  template: "demo-v1";
  migrations: MigrationEntry[];
}

export interface LockEntry {
  id: string;
  /** In a v2 lock, the CLI release line ("0.2") the entry is grouped under. */
  cliVersion: string;
  manifestHash: string;
  /** The migration's `payloadHash` at apply time. Absent on entries written
   *  before it existed; those are compared on `manifestHash` alone. */
  payloadHash?: string;
}

export interface LockFile {
  version: 1;
  template: "demo-v1";
  applied: LockEntry[];
}

export class LegacyLockError extends Error {
  constructor() {
    super(
      "Legacy lock file found at .igrpmigrations/lock.json.\nRun `igrp-migrate convert` to upgrade, then retry."
    );
    this.name = "LegacyLockError";
  }
}
