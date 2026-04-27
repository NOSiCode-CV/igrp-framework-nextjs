import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import type { Manifest } from "./types.js";

// When bundled by tsup, import.meta.url resolves to the dist/ directory.
// manifest.json is placed alongside the bundled JS by the prebuild script.
const __dirname = fileURLToPath(new URL(".", import.meta.url));

let _manifest: Manifest | null = null;

export function getManifest(): Manifest {
  if (_manifest) return _manifest;
  // dist/manifest.json is in the same directory as this bundled module
  const manifestPath = join(__dirname, "manifest.json");
  const raw = readFileSync(manifestPath, "utf8");
  _manifest = JSON.parse(raw) as Manifest;
  return _manifest;
}
