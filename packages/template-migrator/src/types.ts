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
  | { type: "deps.bump"; manifest: string; ranges: Record<string, string> };

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
  template: "demo-legacy";
  migrations: MigrationEntry[];
}

export interface LockEntry {
  id: string;
  appliedAt: string;
  cliVersion: string;
  manifestHash: string;
  undo: MigrationStep[];
  fileHashes: Record<string, string>;
}

export interface LockFile {
  version: 1;
  template: "demo-legacy";
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
