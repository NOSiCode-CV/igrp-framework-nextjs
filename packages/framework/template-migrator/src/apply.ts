import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join, resolve, sep } from "path";
import { fileURLToPath } from "url";
import type { EnvKeySpec, MigrationStep } from "./types.js";

// When bundled by tsup, import.meta.url resolves to the dist/ directory.
// dist/payload/ is placed alongside the bundled JS by the prebuild script.
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PAYLOAD_DIR = join(__dirname, "payload");

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

/**
 * Every write this package performs must land inside the consumer's app root.
 *
 * Exported because the rollback/unwind paths restore files from stored undo
 * payloads with a bare `writeFileSync` rather than through `executeStep`, and
 * must not be the one door left unlocked: the paths they use come from the
 * app's own lock/journal, which is a file on disk that can be hand-edited,
 * corrupted, or merged badly.
 */
export function assertInsideAppRoot(appRoot: string, target: string): void {
  const root = resolve(appRoot);
  const resolved = resolve(target);
  if (resolved !== root && !resolved.startsWith(root + sep)) {
    throw new Error(`Refusing to operate outside the app root: ${target}`);
  }
}

/** Marker `env.add` writes for `required_if`, and `env.remove` reads back. */
const REQUIRED_IF_PREFIX = "Required if: ";

/** Keep an existing file's line endings rather than forcing LF into a CRLF file. */
function detectEol(content: string): string {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function envHasKey(content: string, key: string): boolean {
  return content.split(/\r?\n/).some((line) => {
    const t = line.trimStart();
    return t.startsWith(`${key}=`) || t.startsWith(`${key} =`);
  });
}

/**
 * Resolve a step's `from` to a file inside the shipped payload tree.
 *
 * `from` is authored relative to `migrations/demo-v1/` (e.g.
 * `payload/41/src/x.ts`), but the packer drops the `payload/` prefix on the way
 * into `dist/payload/`, so it has to come off again here.
 */
export function resolvePayload(from: string, payloadDir: string = PAYLOAD_DIR): string {
  const rel = from.startsWith("payload/") ? from.slice("payload/".length) : from;
  return join(payloadDir, rel);
}

export function executeStep(
  step: MigrationStep,
  appRoot: string,
  payloadDir: string = PAYLOAD_DIR
): MigrationStep {
  switch (step.type) {
    case "file.create":
    case "file.write": {
      const dest = join(appRoot, step.path);
      assertInsideAppRoot(appRoot, dest);
      const existed = existsSync(dest);
      if (step.type === "file.write" && step.mode === "patch") {
        throw new Error(
          `file.write patch mode is not supported (path: ${step.path}). ` +
            `Use mode: "replace" with a full-file payload via "from".`,
        );
      }
      if (!step.from) {
        throw new Error(`file.${step.type === "file.create" ? "create" : "write"} requires "from" (path: ${step.path}).`);
      }
      const src = resolvePayload(step.from, payloadDir);
      ensureDir(dest);
      copyFileSync(src, dest);
      // Return undo step
      if (!existed) return { type: "file.delete", path: step.path };
      return { type: "file.write", mode: "replace", path: step.path, from: "__undo__" };
    }
    case "file.delete": {
      const target = join(appRoot, step.path);
      assertInsideAppRoot(appRoot, target);
      if (existsSync(target)) rmSync(target, { recursive: true, force: true });
      return { type: "file.create", path: step.path, from: "__undo__" };
    }
    case "env.add": {
      const envPath = join(appRoot, step.file);
      assertInsideAppRoot(appRoot, envPath);
      const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
      const eol = detectEol(existing);
      const lines: string[] = [];
      const addedKeys: string[] = [];
      for (const [key, spec] of Object.entries(step.keys)) {
        if (envHasKey(existing, key)) continue;
        addedKeys.push(key);
        // An undocumented key gets no comment line. Writing `# ` unconditionally
        // meant a remove/undo round-trip of a key that never had a comment
        // *added* an empty one.
        if (spec.doc) lines.push(`# ${spec.doc}`);
        if (spec.required_if) lines.push(`# ${REQUIRED_IF_PREFIX}${spec.required_if}`);
        lines.push(`${key}=${spec.default ?? ""}`);
        lines.push("");
      }
      if (lines.length > 0) {
        // An empty (or whitespace-only) file gets no leading blank lines —
        // `"".trimEnd() + eol + eol` would open every fresh .env with two.
        const prefix = existing.trim() === "" ? "" : existing.trimEnd() + eol + eol;
        writeFileSync(envPath, prefix + lines.join(eol), "utf8");
      }
      // Undo must list only keys THIS call actually appended — never keys that
      // were already present, or rollback would delete the consumer's own data.
      return { type: "env.remove", file: step.file, keys: addedKeys };
    }
    case "env.remove": {
      const envPath = join(appRoot, step.file);
      assertInsideAppRoot(appRoot, envPath);
      if (!existsSync(envPath)) return { type: "env.add", file: step.file, keys: {} };
      const original = readFileSync(envPath, "utf8");
      const eol = detectEol(original);
      const lines = original.split(/\r?\n/);
      const removed: Record<string, EnvKeySpec> = {};
      const drop = new Set<number>();

      lines.forEach((line, i) => {
        const t = line.trimStart();
        const hit = step.keys.find((k) => t.startsWith(`${k}=`) || t.startsWith(`${k} =`));
        if (!hit) return;
        drop.add(i);
        // Take the contiguous comment block directly above the key with it.
        // `env.add` wrote that block, so its undo has to remove it again —
        // otherwise every apply/rollback cycle leaves another orphaned `# doc`
        // line behind and the file accumulates comment cruft forever.
        //
        // Only when the key is the last line of its block, though. `env.add`
        // always writes `# doc` / `KEY=` / blank, so a blank line (or EOF)
        // below is the signature of a block it owns. A section header reads
        // identically from above:
        //
        //     # ===== OIDC settings =====
        //     OIDC_A=1      <- removing this must NOT take the header
        //     OIDC_B=2         with it and orphan OIDC_B
        //
        // The difference is what follows, so that is what decides it.
        const ownsCommentBlock = lines[i + 1] === "" || i + 1 >= lines.length;
        const doc: string[] = [];
        if (ownsCommentBlock) {
          for (let j = i - 1; j >= 0; j--) {
            const c = lines[j].trimStart();
            if (!c.startsWith("#")) break;
            const text = c.replace(/^#\s?/, "");
            // A commented-out setting is the consumer's own data, not prose
            // about this key. Stop rather than absorb it as documentation.
            if (/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(text)) break;
            doc.unshift(text);
            drop.add(j);
          }
          // ...and the single blank line `env.add` appends as a separator.
          if (lines[i + 1] === "") drop.add(i + 1);
        }
        if (hit in removed) return; // duplicate declaration: the first one wins
        // Recover `doc` / `required_if` from that comment block, so the undo
        // restores the real documentation instead of a bare `# ` line.
        const reqIdx = doc.findIndex((d) => d.startsWith(REQUIRED_IF_PREFIX));
        removed[hit] = {
          doc: doc.filter((_, k) => k !== reqIdx).join(" ").trim(),
          default: t.slice(t.indexOf("=") + 1),
          ...(reqIdx !== -1 ? { required_if: doc[reqIdx].slice(REQUIRED_IF_PREFIX.length) } : {}),
        };
      });

      const kept = lines.filter((_, i) => !drop.has(i));
      writeFileSync(envPath, kept.join(eol), "utf8");
      // Undo of a remove is re-adding the captured keys.
      return { type: "env.add", file: step.file, keys: removed };
    }
    case "deps.bump": {
      const pkgPath = join(appRoot, step.manifest);
      assertInsideAppRoot(appRoot, pkgPath);
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const prevRanges: Record<string, string> = {};
      const skipped: string[] = [];
      for (const [dep, version] of Object.entries(step.ranges)) {
        if (pkg.dependencies?.[dep]) {
          prevRanges[dep] = pkg.dependencies[dep];
          pkg.dependencies[dep] = version;
        } else if (pkg.devDependencies?.[dep]) {
          prevRanges[dep] = pkg.devDependencies[dep];
          pkg.devDependencies[dep] = version;
        } else {
          // A dep the migration bumps but this app doesn't declare. Adding it
          // would be wrong (the app may have removed it deliberately), but
          // silence is worse: some bumps are load-bearing for the migration's
          // own feature — e.g. 29-permissions-catalog-sync needs an AM client
          // that actually has `syncPermissions` — and a quiet skip turns into
          // a runtime failure long after `apply` reported success.
          skipped.push(`${dep}@${version}`);
        }
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      if (skipped.length > 0) {
        console.warn(
          `  ⚠ ${step.manifest}: not declared by this app, so NOT bumped: ${skipped.join(", ")}\n` +
            `    If the migration's feature depends on one of these, add it manually.`,
        );
      }
      return { type: "deps.bump", manifest: step.manifest, ranges: prevRanges };
    }
    case "deps.remove": {
      // The inverse of deps.bump, for a dependency the template has DROPPED.
      // Without this, a removal can only ever reach scaffolded apps (via the
      // zip): the migrate channel had no way to express it, so upgraded apps
      // kept carrying a dependency the template no longer declares and the two
      // channels silently diverged. `check:drift` fails on exactly that.
      const pkgPath = join(appRoot, step.manifest);
      assertInsideAppRoot(appRoot, pkgPath);
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      // Capture which FIELD each dep came from so the undo restores it to the
      // same place — putting a devDependency back under `dependencies` would
      // quietly change what ships in a production install.
      const removed: Record<string, { field: "dependencies" | "devDependencies"; range: string }> = {};
      const absent: string[] = [];
      for (const dep of step.deps) {
        if (pkg.dependencies?.[dep] !== undefined) {
          removed[dep] = { field: "dependencies", range: pkg.dependencies[dep] };
          delete pkg.dependencies[dep];
        } else if (pkg.devDependencies?.[dep] !== undefined) {
          removed[dep] = { field: "devDependencies", range: pkg.devDependencies[dep] };
          delete pkg.devDependencies[dep];
        } else {
          // Already gone. Not an error — a catch-up migration re-applied over an
          // already-current tree must not abort — but say so, because "removed
          // nothing" and "removed something" look identical in the output.
          absent.push(dep);
        }
      }
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
      if (absent.length > 0) {
        console.warn(
          `  ⚠ ${step.manifest}: not declared by this app, so nothing to remove: ${absent.join(", ")}`,
        );
      }
      return { type: "deps.restore", manifest: step.manifest, removed };
    }
    case "deps.restore": {
      // Undo of deps.remove — re-declares each dependency in the field it came
      // from, with the range it had. Keys are re-sorted so the restored manifest
      // matches the ordering npm/pnpm write, rather than appending to the end.
      const pkgPath = join(appRoot, step.manifest);
      assertInsideAppRoot(appRoot, pkgPath);
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const touched = new Set<string>();
      for (const [dep, { field, range }] of Object.entries(step.removed)) {
        pkg[field] ??= {};
        pkg[field][dep] = range;
        touched.add(field);
      }
      for (const field of touched) {
        pkg[field] = Object.fromEntries(
          Object.entries(pkg[field] as Record<string, string>).sort(([a], [b]) => a.localeCompare(b)),
        );
      }
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
      return { type: "deps.remove", manifest: step.manifest, deps: Object.keys(step.removed) };
    }
    default:
      throw new Error(`Unknown step type: ${(step as { type: string }).type}`);
  }
}
