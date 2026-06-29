import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createHash } from "crypto";
import { fileURLToPath, URL } from "url";
import { parse as parseYaml } from "yaml";
import { sortMigrationFiles } from "../src/migration-order.js";
import { validateRequires } from "../src/validate-requires.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "migrations/demo-v1");
const OUT_DIR = join(ROOT, "dist");
const PAYLOAD_OUT = join(OUT_DIR, "payload");

interface FrontMatter {
  id: string;
  date: string;
  targetFrameworkVersion: string | null;
  requires: string[];
  steps: Record<string, unknown>[];
}

function parseFrontMatter(content: string): { fm: FrontMatter; body: string } {
  // Normalise CRLF → LF so the regex works on both Windows and Unix.
  const normalised = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter found");
  const fm = parseYaml(match[1]) as FrontMatter;
  return { fm, body: match[2] };
}

function hashString(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

function copyPayloads(steps: Record<string, unknown>[], migrationsDir: string, payloadOut: string) {
  for (const step of steps) {
    const from = step["from"];
    if (typeof from === "string" && !from.startsWith("__")) {
      const src = join(migrationsDir, from);
      // Strip the leading "payload/" prefix so files land at dist/payload/NN/...
      // rather than the redundant dist/payload/payload/NN/...
      const rel = from.startsWith("payload/") ? from.slice("payload/".length) : from;
      const dest = join(payloadOut, rel);
      if (!existsSync(src)) {
        console.warn(`Warning: payload not found: ${src}`);
        continue;
      }
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    }
  }
}

function main() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string };
  // Clean previous payload output so stale files don't linger between builds.
  if (existsSync(PAYLOAD_OUT)) rmSync(PAYLOAD_OUT, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(PAYLOAD_OUT, { recursive: true });

  const files = sortMigrationFiles(
    readdirSync(MIGRATIONS_DIR).filter((f) => f.match(/^\d+\.MIGRATIONS.*\.md$/)),
  );

  const migrations = [];
  for (const file of files) {
    const raw = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const { fm } = parseFrontMatter(raw);
    copyPayloads(fm.steps, MIGRATIONS_DIR, PAYLOAD_OUT);
    const contentHash = hashString(JSON.stringify(fm.steps));
    migrations.push({
      id: fm.id,
      date: fm.date,
      requires: fm.requires || [],
      targetFrameworkVersion: fm.targetFrameworkVersion ?? null,
      steps: fm.steps,
      guideHref: file,
      contentHash,
    });
    console.log(`  packed ${fm.id}`);
  }

  // Fail the pack if ids aren't unique or a `requires` points forward / at an
  // unknown id — a bad manifest would permanently deadlock consumer `apply`.
  validateRequires(migrations);

  const manifest = {
    version: 1,
    cliVersion: pkg.version,
    template: "demo-v1",
    migrations,
  };

  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nManifest written: ${migrations.length} migrations\n`);
}

main();
