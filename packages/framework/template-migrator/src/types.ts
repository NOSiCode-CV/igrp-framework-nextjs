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
  // devDependency rather than promoted into `dependencies`.
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
}

export interface Manifest {
  version: 1;
  cliVersion: string;
  template: "demo-v1";
  migrations: MigrationEntry[];
}

export interface LockEntry {
  id: string;
  appliedAt: string;
  cliVersion: string;
  manifestHash: string;
  undo: MigrationStep[];
  fileHashes: Record<string, string>;
  /**
   * Pre-migration file contents keyed by app-relative path, captured at apply
   * time for steps whose undo would otherwise be an unrestorable `__undo__`
   * placeholder (file.write over an existing file, file.delete). Absent on
   * lock entries written by older CLI versions. Payload contents are stored
   * as UTF-8 text; binary files are not supported for undo capture
   * (executeStep itself copies binary fine — only rollback restoration is
   * text-only). First capture wins when a migration touches the same path
   * more than once — the first snapshot is the true pre-migration content.
   */
  undoPayloads?: Record<string, string>;
  /**
   * Hash of every file this migration wrote, taken AFTER the write.
   *
   * This is what lets a later `apply` tell "the consumer edited this managed
   * file" apart from "the previous migration left it this way", and refuse to
   * clobber the former. Deliberately separate from `fileHashes` (which records
   * the PRE-migration state and exists only as a forensic record): repurposing
   * that field would make every entry written by an older CLI look like a local
   * modification. Absent on entries from CLI versions before this field, which
   * are simply not checked.
   */
  postHashes?: Record<string, string>;
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
