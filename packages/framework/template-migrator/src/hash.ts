import { createHash } from "crypto";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

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

/**
 * Hash of the payload files a migration's steps copy (`from`), EOL-normalised
 * like hashFileIgnoringEol. Computed at pack time from the source payloads and
 * stamped into the manifest as `payloadHash`; consumers never have the files.
 *
 * Kept apart from `contentHash` on purpose: every lock written before this
 * field existed records a steps-only `manifestHash`, so folding payloads into
 * that hash would flag every applied migration as changed. A lock entry
 * without `payloadHash` is simply not compared on it (see isStale).
 */
export function hashPayloads(steps: unknown, migrationsDir: string): string {
  const parts = (Array.isArray(steps) ? steps : [])
    .map((step) => (step as Record<string, unknown>)["from"])
    .filter((from): from is string => typeof from === "string" && !from.startsWith("__"))
    .map((from) => `${from}:${hashFileIgnoringEol(join(migrationsDir, from)) ?? "missing"}`);
  return hashContent(parts.join("\n"));
}

/**
 * Why an applied migration is stale: its `steps` changed, only its payload
 * files changed, or neither (null). The two need different advice — after a
 * payload-only change the app's files differ from the NEW payload by
 * definition, so rollback's edit guard always refuses; the fix is to drop the
 * lock entry and re-apply.
 */
export function staleCause(
  entry: { manifestHash: string; payloadHash?: string } | undefined,
  m: { contentHash: string; payloadHash?: string },
): "steps" | "payload" | null {
  if (entry === undefined) return null;
  if (entry.manifestHash !== m.contentHash) return "steps";
  return entry.payloadHash !== undefined && m.payloadHash !== undefined && entry.payloadHash !== m.payloadHash
    ? "payload"
    : null;
}

/** An applied migration whose steps, or payloads, changed after it was applied. */
export function isStale(
  entry: { manifestHash: string; payloadHash?: string } | undefined,
  m: { contentHash: string; payloadHash?: string },
): boolean {
  return staleCause(entry, m) !== null;
}
