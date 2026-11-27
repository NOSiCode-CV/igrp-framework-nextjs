/**
 * `computedHash` for skills-lock.json, the same algorithm as the upstream `skills`
 * CLI (lock version 2, checked against skills@1.8.1 `computeSkillFolderHash`), so
 * the CLI and this repo agree on every hash.
 *
 * sha256 over the skill folder's files, sorted by UTF-8 relative path, feeding
 * `path \0 byteLength \0 content` per file. Text content has CRLF turned into LF
 * first (a file containing a NUL byte is binary and hashed raw), so a Windows
 * clone with `core.autocrlf=true` or a stale CRLF checkout hashes the same as the
 * committed LF blobs. `metadata.json` files and `.git`/`__pycache__`/`__pypackages__`
 * directories are skipped, as upstream does.
 */

import { createHash } from 'crypto';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const EXCLUDE_FILES = new Set(['metadata.json']);
const EXCLUDE_DIRS = new Set(['.git', '__pycache__', '__pypackages__']);

export function normalizeLineEndings(content) {
  if (content.includes(0) || !content.includes('\r\n')) return content;
  return Buffer.from(content.toString('latin1').replaceAll('\r\n', '\n'), 'latin1');
}

/** @param {{ path: string, content: Buffer }[]} files paths relative to the skill folder */
export function hashSkillFiles(files) {
  const entries = files
    .filter((f) => {
      const parts = f.path.split(/[\\/]/).filter(Boolean);
      return !parts.some((p, i) => (i < parts.length - 1 ? EXCLUDE_DIRS : EXCLUDE_FILES).has(p));
    })
    .map((f) => ({
      path: Buffer.from(f.path.split('\\').join('/'), 'utf-8'),
      content: normalizeLineEndings(f.content),
    }))
    .sort((a, b) => Buffer.compare(a.path, b.path));
  const hash = createHash('sha256');
  for (const { path, content } of entries) {
    hash.update(path);
    hash.update('\0');
    hash.update(String(content.length));
    hash.update('\0');
    hash.update(content);
  }
  return hash.digest('hex');
}

export function computeSkillFolderHash(dir) {
  const files = [];
  const walk = (current, prefix) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full, `${prefix}${name}/`);
      else files.push({ path: prefix + name, content: readFileSync(full) });
    }
  };
  walk(dir, '');
  return hashSkillFiles(files);
}
