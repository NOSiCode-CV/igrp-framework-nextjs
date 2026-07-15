import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { sortMigrationFiles } from "../src/migration-order.js";
import { findOrphanFiles } from "./drift-orphans.js";

// Drift gate: verify that the migration payloads still match the live template.
//
// The payload tree (migrations/demo-v1/payload/NN/) is a hand-maintained
// copy of templates/demo-v1. When someone edits the template but forgets to
// author a migration, the two trees silently diverge: new apps (scaffolded from
// the zip) get the change, existing apps (upgraded via the migrator) never do.
//
// This script reconciles them. For every file path the migrations manage, it
// compares the LATEST payload state against the current template file and fails
// if they differ — so a forgotten migration can't pass into a release.
//
// It also runs the inverse check: every git-tracked template file must be
// migration-managed, exempt (docs/AI-tooling/zip-excluded paths — see
// drift-orphans.ts), or grandfathered in migrations/demo-v1/template-baseline.json.
// A brand-new template file matching none of those is an "orphan" and fails the
// gate: author a file.create migration for it, or — when it deliberately should
// not ship to existing apps — regenerate the baseline with --update-baseline.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "migrations/demo-v1");
// packages/template-migrator -> ../.. -> repo root -> templates/demo-v1
const TEMPLATE_DIR = join(ROOT, "../../templates/demo-v1");
const TEMPLATE_PKG = join(TEMPLATE_DIR, "package.json");
const PACKAGES_DIR = join(ROOT, "../../packages");
const BASELINE_FILE = join(MIGRATIONS_DIR, "template-baseline.json");

interface FrontMatter {
  id: string;
  steps: Record<string, unknown>[];
}

function parseFrontMatter(content: string): FrontMatter {
  // Normalise CRLF -> LF so the regex works on both Windows and Unix.
  const normalised = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter found");
  return parseYaml(match[1]) as FrontMatter;
}

// Compare ignoring line-ending differences only — everything else is real drift.
function normalise(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// name -> version map of every workspace package, so a template `workspace:*`
// dep can be resolved to the concrete version a consumer would actually receive.
function buildWorkspaceVersions(): Record<string, string> {
  const map: Record<string, string> = {};
  if (!existsSync(PACKAGES_DIR)) return map;
  const entries = readdirSync(PACKAGES_DIR, { recursive: true }) as string[];
  for (const rel of entries) {
    if (!rel.endsWith("package.json")) continue;
    if (rel.split(/[\\/]/).includes("node_modules")) continue;
    try {
      const pkg = JSON.parse(readFileSync(join(PACKAGES_DIR, rel), "utf8"));
      if (pkg.name && pkg.version) map[pkg.name] = pkg.version;
    } catch {
      /* unparsable package.json — skip */
    }
  }
  return map;
}

// Files of the live template, relative POSIX paths: tracked plus
// untracked-but-not-gitignored, so a freshly added file is caught before it is
// even committed. Returns null when enumeration is impossible (git missing /
// not a work tree) — the orphan check degrades to a warning rather than
// failing the whole gate.
function listTemplateFiles(): string[] | null {
  try {
    const out = execSync("git ls-files --cached --others --exclude-standard", {
      cwd: TEMPLATE_DIR,
      encoding: "utf8",
    });
    return out.split(/\r?\n/).filter((l) => l.length > 0);
  } catch {
    return null;
  }
}

function readBaseline(): string[] | null {
  if (!existsSync(BASELINE_FILE)) return null;
  const parsed = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as { files?: string[] };
  return parsed.files ?? [];
}

function writeBaseline(files: string[]): void {
  const doc = {
    comment:
      "Template files grandfathered by the drift gate's new-file check: they predate migration coverage (or deliberately don't ship to existing apps) and no migration manages them. New template files must NOT be added here casually — author a file.create migration instead. Regenerate deliberately with: pnpm --filter @igrp/template-migrator check:drift:update-baseline",
    files,
  };
  writeFileSync(BASELINE_FILE, JSON.stringify(doc, null, 2) + "\n", "utf8");
}

type FinalState =
  | { op: "present"; from: string; migrationId: string } // file.create / file.write replace
  | { op: "patch"; migrationId: string } // file.write patch — no full-file payload
  | { op: "absent"; migrationId: string }; // file.delete

function main(): void {
  if (!existsSync(TEMPLATE_DIR)) {
    console.error(`Template directory not found: ${TEMPLATE_DIR}`);
    process.exit(1);
  }

  const files = sortMigrationFiles(
    readdirSync(MIGRATIONS_DIR).filter((f) => f.match(/^\d+\.MIGRATIONS.*\.md$/)),
  );

  // Collapse all migrations into the final expected state per managed path.
  // Later migrations override earlier ones for the same path.
  const finalState = new Map<string, FinalState>();
  // Latest deps.bump range per dependency (last migration to pin it wins).
  const depRanges = new Map<string, { version: string; migrationId: string }>();
  // Every path any migration step touches (file.*, env.add file, deps.bump
  // manifest) — a migration already ships/maintains these, so the new-file
  // (orphan) check must not flag them.
  const managedPaths = new Set<string>();

  for (const file of files) {
    const raw = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const { id, steps } = parseFrontMatter(raw);
    for (const step of steps) {
      const type = step["type"] as string;
      if (type === "deps.bump") {
        if (typeof step["manifest"] === "string") managedPaths.add(step["manifest"]);
        const ranges = (step["ranges"] as Record<string, string>) ?? {};
        for (const [dep, version] of Object.entries(ranges)) {
          depRanges.set(dep, { version, migrationId: id });
        }
        continue;
      }
      if (typeof step["file"] === "string") managedPaths.add(step["file"]);
      const path = step["path"] as string | undefined;
      if (!path) continue; // env.add is not path-based file content
      managedPaths.add(path);
      if (type === "file.create") {
        finalState.set(path, { op: "present", from: step["from"] as string, migrationId: id });
      } else if (type === "file.write") {
        if (typeof step["from"] === "string") {
          finalState.set(path, { op: "present", from: step["from"], migrationId: id });
        } else {
          finalState.set(path, { op: "patch", migrationId: id });
        }
      } else if (type === "file.delete") {
        finalState.set(path, { op: "absent", migrationId: id });
      }
    }
  }

  const drifted: { path: string; migrationId: string }[] = [];
  const missingTemplate: { path: string; migrationId: string }[] = [];
  const missingPayload: { path: string; from: string; migrationId: string }[] = [];
  const staleDelete: { path: string; migrationId: string }[] = [];
  const unverifiable: { path: string; migrationId: string }[] = [];

  for (const [path, state] of finalState) {
    const templateFile = join(TEMPLATE_DIR, path);

    if (state.op === "absent") {
      // A migration deletes this path; the live template should not have it.
      if (existsSync(templateFile)) staleDelete.push({ path, migrationId: state.migrationId });
      continue;
    }

    if (state.op === "patch") {
      // Textual patch, no full-file payload to diff against. Flag as unverified.
      unverifiable.push({ path, migrationId: state.migrationId });
      continue;
    }

    // op === "present": payload must exist AND match the live template byte-for-byte.
    const payloadFile = join(MIGRATIONS_DIR, state.from);
    if (!existsSync(payloadFile)) {
      missingPayload.push({ path, from: state.from, migrationId: state.migrationId });
      continue;
    }
    if (!existsSync(templateFile)) {
      missingTemplate.push({ path, migrationId: state.migrationId });
      continue;
    }
    if (normalise(readFileSync(payloadFile, "utf8")) !== normalise(readFileSync(templateFile, "utf8"))) {
      drifted.push({ path, migrationId: state.migrationId });
    }
  }

  // --- dependency drift ---------------------------------------------------
  // The template pins its @igrp/* deps as `workspace:*`, so the version a
  // consumer actually gets is the current workspace version (what the zip
  // resolves to at publish time). A migration's deps.bump must keep pace: if
  // the workspace version moved past the latest deps.bump range, upgrade
  // consumers are stranded on an old version with nothing to warn about.
  const depDrift: { dep: string; expected: string; pinned: string; migrationId: string }[] = [];
  const depMissingInTemplate: { dep: string; migrationId: string }[] = [];
  const depUnpinned: string[] = [];

  const tplPkg = existsSync(TEMPLATE_PKG) ? JSON.parse(readFileSync(TEMPLATE_PKG, "utf8")) : {};
  const tplDeps: Record<string, string> = { ...(tplPkg.dependencies ?? {}), ...(tplPkg.devDependencies ?? {}) };
  const ws = buildWorkspaceVersions();
  const effective = (dep: string, declared: string) => (declared === "workspace:*" ? ws[dep] : declared);

  // Every dep a migration pins must match the template's effective version.
  for (const [dep, { version, migrationId }] of depRanges) {
    if (!(dep in tplDeps)) {
      depMissingInTemplate.push({ dep, migrationId });
      continue;
    }
    const eff = effective(dep, tplDeps[dep]);
    if (eff && eff !== version) depDrift.push({ dep, expected: eff, pinned: version, migrationId });
  }
  // Warn about @igrp/* template deps no migration ever pins — consumers never
  // get a version bump for these through the migrator.
  for (const [dep, declared] of Object.entries(tplDeps)) {
    if (dep.startsWith("@igrp/") && !depRanges.has(dep)) depUnpinned.push(declared === "workspace:*" ? dep : `${dep} (${declared})`);
  }

  // --- new-file (orphan) drift ---------------------------------------------
  // Every tracked template file must be migration-managed, exempt, or in the
  // baseline. Otherwise scaffolded apps get it but upgraded apps never do.
  const updateBaseline = process.argv.includes("--update-baseline");
  const templateFiles = listTemplateFiles();
  let orphans: string[] = [];
  let staleBaseline: string[] = [];
  let orphanCheckSkipped = false;
  let baselineMissing = false;

  if (templateFiles === null) {
    orphanCheckSkipped = true;
  } else if (updateBaseline) {
    // Full recompute: tracked − managed − exempt. Prunes stale entries too.
    const regenerated = findOrphanFiles({ templateFiles, managedPaths, baseline: [] });
    writeBaseline(regenerated.orphans);
    console.log(`Baseline regenerated: ${regenerated.orphans.length} grandfathered file(s) written to ${BASELINE_FILE}\n`);
  } else {
    const baseline = readBaseline();
    if (baseline === null) {
      baselineMissing = true;
    } else {
      ({ orphans, staleBaseline } = findOrphanFiles({ templateFiles, managedPaths, baseline }));
    }
  }

  const managed = finalState.size;
  const fileCount = templateFiles === null ? "?" : String(templateFiles.length);
  console.log(`Checked ${managed} migration-managed path(s), ${depRanges.size} dependency pin(s), and ${fileCount} tracked template file(s) against ${TEMPLATE_DIR}\n`);

  // Soft warnings — informational, do not fail the gate.
  if (depUnpinned.length > 0) {
    console.log(`ℹ ${depUnpinned.length} @igrp/* template dep(s) never pinned by any migration:`);
    for (const d of depUnpinned) console.log(`    ${d}`);
    console.log("");
  }
  if (unverifiable.length > 0) {
    console.log(`ℹ ${unverifiable.length} patch-mode path(s) not content-verified (no full-file payload):`);
    for (const u of unverifiable) console.log(`    ${u.path}  (${u.migrationId})`);
    console.log("");
  }
  if (staleDelete.length > 0) {
    console.log(`⚠ ${staleDelete.length} path(s) a migration deletes but the template still has:`);
    for (const s of staleDelete) console.log(`    ${s.path}  (${s.migrationId})`);
    console.log("");
  }
  if (orphanCheckSkipped) {
    console.log("⚠ new-file check skipped: could not enumerate template files (git ls-files failed).\n");
  }
  if (staleBaseline.length > 0) {
    console.log(`⚠ ${staleBaseline.length} baseline entry(ies) the template no longer has (prune with --update-baseline):`);
    for (const s of staleBaseline) console.log(`    ${s}`);
    console.log("");
  }

  // Hard failures — block the release.
  const failed =
    drifted.length + missingTemplate.length + missingPayload.length + depDrift.length + depMissingInTemplate.length +
    orphans.length + (baselineMissing ? 1 : 0);
  if (failed === 0) {
    console.log("✓ No drift: every migration-managed file and dependency pin matches the template, and no unmanaged new files were found.");
    return;
  }

  if (drifted.length > 0) {
    console.error(`✗ ${drifted.length} file(s) changed in the template but NOT captured in a migration:`);
    for (const d of drifted) console.error(`    ${d.path}  (latest migration: ${d.migrationId})`);
    console.error("");
    console.error("  → Author a new migration that re-captures these files into a fresh payload/NN/.");
    console.error("    See README.md → \"Adding a new migration\".\n");
  }
  if (missingTemplate.length > 0) {
    console.error(`✗ ${missingTemplate.length} file(s) a migration ships but the template no longer has:`);
    for (const m of missingTemplate) console.error(`    ${m.path}  (${m.migrationId})`);
    console.error("");
  }
  if (missingPayload.length > 0) {
    console.error(`✗ ${missingPayload.length} migration payload file(s) missing on disk:`);
    for (const m of missingPayload) console.error(`    ${m.from}  (${m.migrationId})`);
    console.error("");
  }
  if (depDrift.length > 0) {
    console.error(`✗ ${depDrift.length} dependency(ies) bumped in the workspace but NOT captured in a migration:`);
    for (const d of depDrift) {
      console.error(`    ${d.dep}: template resolves to ${d.expected}, latest migration pins ${d.pinned} (${d.migrationId})`);
    }
    console.error("");
    console.error("  → Add a deps.bump step (in a new migration) updating these to the current version.\n");
  }
  if (depMissingInTemplate.length > 0) {
    console.error(`✗ ${depMissingInTemplate.length} dependency(ies) a migration bumps but the template doesn't declare:`);
    for (const d of depMissingInTemplate) console.error(`    ${d.dep}  (${d.migrationId})`);
    console.error("");
  }
  if (baselineMissing) {
    console.error(`✗ Baseline file missing: ${BASELINE_FILE}`);
    console.error("  → Generate it with: pnpm --filter @igrp/template-migrator check:drift:update-baseline\n");
  }
  if (orphans.length > 0) {
    console.error(`✗ ${orphans.length} new template file(s) no migration ships and the baseline doesn't grandfather:`);
    for (const o of orphans) console.error(`    ${o}`);
    console.error("");
    console.error("  → Author a file.create migration shipping these to existing apps (preferred),");
    console.error("    or, if they deliberately should not reach upgraded apps, regenerate the");
    console.error("    baseline with: pnpm --filter @igrp/template-migrator check:drift:update-baseline\n");
  }

  process.exit(1);
}

main();
