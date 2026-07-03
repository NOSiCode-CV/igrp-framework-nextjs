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

function assertInsideAppRoot(appRoot: string, target: string): void {
  const root = resolve(appRoot);
  const resolved = resolve(target);
  if (resolved !== root && !resolved.startsWith(root + sep)) {
    throw new Error(`Refusing to operate outside the app root: ${target}`);
  }
}

function envHasKey(content: string, key: string): boolean {
  return content.split(/\r?\n/).some((line) => {
    const t = line.trimStart();
    return t.startsWith(`${key}=`) || t.startsWith(`${key} =`);
  });
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
      // Strip leading "payload/" prefix — dist/payload/ is already the base dir
      const fromRel = step.from.startsWith("payload/") ? step.from.slice("payload/".length) : step.from;
      const src = join(payloadDir, fromRel);
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
      const lines: string[] = [];
      const addedKeys: string[] = [];
      for (const [key, spec] of Object.entries(step.keys)) {
        if (envHasKey(existing, key)) continue;
        addedKeys.push(key);
        lines.push(`# ${spec.doc}`);
        if (spec.required_if) lines.push(`# Required if: ${spec.required_if}`);
        lines.push(`${key}=${spec.default ?? ""}`);
        lines.push("");
      }
      if (lines.length > 0) {
        const newContent = existing.trimEnd() + "\n\n" + lines.join("\n");
        writeFileSync(envPath, newContent, "utf8");
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
      const removed: Record<string, EnvKeySpec> = {};
      const kept = original.split(/\r?\n/).filter((line) => {
        const t = line.trimStart();
        const hit = step.keys.find((k) => t.startsWith(`${k}=`) || t.startsWith(`${k} =`));
        if (hit) {
          removed[hit] = { doc: "", default: t.slice(t.indexOf("=") + 1) };
          return false;
        }
        return true;
      });
      writeFileSync(envPath, kept.join("\n"), "utf8");
      // Undo of a remove is re-adding the captured keys.
      return { type: "env.add", file: step.file, keys: removed };
    }
    case "deps.bump": {
      const pkgPath = join(appRoot, step.manifest);
      assertInsideAppRoot(appRoot, pkgPath);
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const prevRanges: Record<string, string> = {};
      for (const [dep, version] of Object.entries(step.ranges)) {
        if (pkg.dependencies?.[dep]) {
          prevRanges[dep] = pkg.dependencies[dep];
          pkg.dependencies[dep] = version;
        } else if (pkg.devDependencies?.[dep]) {
          prevRanges[dep] = pkg.devDependencies[dep];
          pkg.devDependencies[dep] = version;
        }
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      return { type: "deps.bump", manifest: step.manifest, ranges: prevRanges };
    }
    default:
      throw new Error(`Unknown step type: ${(step as { type: string }).type}`);
  }
}
