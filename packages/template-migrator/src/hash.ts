import { createHash } from "crypto";
import { readFileSync, existsSync, statSync } from "fs";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function hashFile(filePath: string): string | null {
  // Only regular files are hashable — a directory target (e.g. file.delete
  // on a folder) must yield null, not throw EISDIR.
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return hashContent(readFileSync(filePath, "utf8"));
}

/**
 * Canonical hash of a migration's `steps` array.
 *
 * Shared by the packer (which stamps `contentHash` into dist/manifest.json),
 * the template-lock generator, and the drift gate — so a lock entry's
 * `manifestHash` can be compared against the manifest without the two sides
 * ever computing it differently.
 */
export function hashSteps(steps: unknown): string {
  return hashContent(JSON.stringify(steps));
}
