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
 * Hash a file ignoring line endings.
 *
 * Used to compare a consumer's file against the payload that produced it.
 * Payloads are normalised to LF at pack time, but a consumer on Windows with
 * `core.autocrlf=true` has CRLF on disk — so a byte hash would call every
 * managed file "locally modified" on every Windows checkout. EOL is the one
 * difference that is never a real edit; everything else is.
 */
export function hashFileIgnoringEol(filePath: string): string | null {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return hashContent(readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
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
