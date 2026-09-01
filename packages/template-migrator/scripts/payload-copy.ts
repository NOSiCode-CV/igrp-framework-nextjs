// Payload copying with line-ending normalisation.
//
// The payload tree is hand-captured from templates/demo-v1, usually on Windows
// with `core.autocrlf=true`, so most payload files on disk carry CRLF. The live
// template's source is LF (Biome, which the template ships, formats to LF).
// `copyFileSync` preserves bytes, so without normalisation an app upgraded via
// the CLI ends up with CRLF in files where a freshly scaffolded app has LF —
// the two delivery channels diverge for real, even though the drift gate
// reports clean (it compares EOL-insensitively on purpose).
//
// The consumer-visible cost is not cosmetic: the template's own `pnpm lint`
// (Biome, LF default) rewrites every migrated file on the next run, and
// `git diff` after `igrp-migrate apply` shows whole-file churn instead of the
// change that actually landed.
//
// Normalising here — at pack time, into dist/ — fixes it for every consumer
// without rewriting 166 committed payload files, and makes the EOL habits of
// whoever authored a migration irrelevant to what ships.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

/** Bytes inspected when sniffing for binary content. */
const SNIFF_BYTES = 8000;

/**
 * Treat a payload as binary if it contains a NUL byte in its leading bytes.
 *
 * This is the heuristic git itself uses. Text payloads (the only kind any
 * migration ships today) never contain NUL; images/fonts/archives reliably do.
 * Getting this wrong in the safe direction — classifying text as binary — only
 * means the file is copied verbatim, which is the current behaviour anyway.
 */
export function isBinary(buf: Buffer): boolean {
  return buf.subarray(0, SNIFF_BYTES).includes(0);
}

/** CRLF/CR → LF. */
export function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Copy one payload file, normalising text to LF and leaving binary untouched.
 *
 * Returns true when the content was normalised (i.e. the source had CRLF),
 * so the packer can report how much it touched.
 */
export function copyPayloadFile(src: string, dest: string): boolean {
  const buf = readFileSync(src);
  mkdirSync(dirname(dest), { recursive: true });

  if (isBinary(buf)) {
    copyFileSync(src, dest);
    return false;
  }

  const original = buf.toString("utf8");
  const normalised = toLf(original);
  writeFileSync(dest, normalised, "utf8");
  return normalised !== original;
}
