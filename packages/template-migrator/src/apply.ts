import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { MigrationStep } from "./types.js";

// When bundled by tsup, import.meta.url resolves to the dist/ directory.
// dist/payload/ is placed alongside the bundled JS by the prebuild script.
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PAYLOAD_DIR = join(__dirname, "payload");

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
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
      const existed = existsSync(dest);
      // Strip leading "payload/" prefix — dist/payload/ is already the base dir
      const fromRel = step.from!.startsWith("payload/") ? step.from!.slice("payload/".length) : step.from!;
      const src = join(payloadDir, fromRel);
      ensureDir(dest);
      copyFileSync(src, dest);
      // Return undo step
      if (!existed) return { type: "file.delete", path: step.path };
      return { type: "file.write", mode: "replace", path: step.path, from: "__undo__" };
    }
    case "file.delete": {
      const target = join(appRoot, step.path);
      if (existsSync(target)) rmSync(target, { recursive: true, force: true });
      return { type: "file.create", path: step.path, from: "__undo__" };
    }
    case "env.add": {
      const envPath = join(appRoot, step.file);
      const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
      const lines: string[] = [];
      for (const [key, spec] of Object.entries(step.keys)) {
        if (existing.includes(`${key}=`)) continue;
        lines.push(`# ${spec.doc}`);
        if (spec.required_if) lines.push(`# Required if: ${spec.required_if}`);
        lines.push(`${key}=${spec.default ?? ""}`);
        lines.push("");
      }
      if (lines.length > 0) {
        const newContent = existing.trimEnd() + "\n\n" + lines.join("\n");
        writeFileSync(envPath, newContent, "utf8");
      }
      return { type: "env.add", file: step.file, keys: step.keys };
    }
    case "deps.bump": {
      const pkgPath = join(appRoot, step.manifest);
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
