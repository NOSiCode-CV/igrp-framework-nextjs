#!/usr/bin/env node
/**
 * Sync vendored agent skills into `.claude/skills/`.
 *
 * `.agents/skills/` is the canonical, committed home for vendored third-party
 * skills — it is what `skills-lock.json` pins. `.claude/skills/` is
 * a generated bridge that makes those skills visible to Claude Code; it is
 * gitignored and must never be edited by hand.
 *
 * Real directory copies are used rather than symlinks on purpose: this repo is
 * developed on Windows clones with `core.symlinks=false`, where committed
 * symlinks are materialised as regular files and the bridge silently becomes a
 * second committed copy that can drift from `.agents/skills/`.
 *
 * Usage:
 *   pnpm run skills:sync                 # regenerate .claude/skills from .agents/skills
 *   pnpm run skills:sync -- --check      # verify the local bridge is current
 *   pnpm run skills:sync -- --verify-lock # verify skills-lock.json against .agents/skills
 *   pnpm run skills:lock                 # accept the current .agents/skills content into the lock
 *
 * `--check` is for developer machines only: the bridge is gitignored, so a fresh
 * clone has none and --check correctly reports it stale. CI uses --verify-lock,
 * which checks the invariant that survives a clean checkout: every skill named in
 * skills-lock.json has a source directory whose content hash equals its
 * `computedHash`. Extra directories under .agents/skills/ are fine: a skill can
 * exist without being bridged.
 *
 * `computedHash` is the upstream `skills` CLI's lock-version-2 folder hash (see
 * ./skill-hash.mjs). It turns CRLF into LF before hashing, so the check gives the
 * same answer on a Windows CRLF working tree and on a clean LF checkout. Editing a
 * vendored skill fails --verify-lock until `pnpm skills:lock` records the edit.
 */

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import path, { join, relative, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { computeSkillFolderHash } from './skill-hash.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = join(ROOT, '.agents', 'skills');
const TARGET = join(ROOT, '.claude', 'skills');
const LOCKFILE = join(ROOT, 'skills-lock.json');
// What this script bridged last time. Only those are pruned: `.claude/skills/` is
// gitignored, so a developer's own skill there has no other copy.
const MANIFEST = join(TARGET, '.bridged-skills.json');

function readLock() {
  if (!existsSync(LOCKFILE)) {
    console.error(`skills-lock.json not found at ${relative(ROOT, LOCKFILE)}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(LOCKFILE, 'utf8'));
}

/** Skills listed in skills-lock.json are the ones bridged into .claude/skills. */
function lockedSkills() {
  const names = Object.keys(readLock().skills ?? {});
  // Names become paths that get rmSync'd; a separator or `..` would reach outside TARGET.
  const bad = names.filter((n) => !n || n === '.' || n === '..' || /[\\/]/.test(n));
  if (bad.length) {
    console.error(`skills-lock.json has invalid skill names: ${bad.join(', ')}`);
    process.exit(1);
  }
  return names;
}

function previouslyBridged() {
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    return [];
  }
}

/** Flatten a directory into a sorted list of [relativePath, contents] pairs. */
function snapshot(dir) {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else files.push([relative(dir, full).split('\\').join('/'), readFileSync(full)]);
    }
  };
  if (existsSync(dir)) walk(dir);
  return files;
}

/** A symlink or junction is never up to date — the bridge must be real files. */
function isLink(path) {
  return existsSync(path) && lstatSync(path).isSymbolicLink();
}

function isUpToDate(from, to) {
  if (!existsSync(to) || isLink(to)) return false;
  const a = snapshot(from);
  const b = snapshot(to);
  if (a.length !== b.length) return false;
  return a.every(([path, contents], i) => b[i][0] === path && contents.equals(b[i][1]));
}

const check = process.argv.includes('--check');
const verifyLock = process.argv.includes('--verify-lock');
const updateLock = process.argv.includes('--update-lock');
const skills = lockedSkills();

// CI mode: only the lockfile <-> source relationship, which a clean checkout has.
// --update-lock walks the same path and rewrites the hashes instead of failing.
if (verifyLock || updateLock) {
  const missing = skills.filter((s) => !existsSync(join(SOURCE, s)));
  if (missing.length) {
    console.error(`skills-lock.json names skills with no source directory: ${missing.join(', ')}`);
    console.error(`Expected each under ${relative(ROOT, SOURCE).split(path.sep).join('/')}/<name>/.`);
    process.exit(1);
  }
  const lock = readLock();
  const changed = skills.filter((s) => {
    const hash = computeSkillFolderHash(join(SOURCE, s));
    if (hash === lock.skills[s].computedHash) return false;
    if (verifyLock) {
      console.error(`${s}: .agents/skills/${s} does not match skills-lock.json`);
      console.error(`  locked ${lock.skills[s].computedHash}
  actual ${hash}`);
    }
    lock.skills[s].computedHash = hash;
    return true;
  });
  if (updateLock) {
    // Version 2 is the lock format whose hash skill-hash.mjs implements.
    lock.version = 2;
    writeFileSync(LOCKFILE, `${JSON.stringify(lock, null, 2)}
`);
    console.log(changed.length ? `skills-lock.json: updated ${changed.join(', ')}.` : 'skills-lock.json already current.');
    process.exit(0);
  }
  if (changed.length) {
    console.error('If the change is intended, run `pnpm skills:lock` and commit skills-lock.json.');
    process.exit(1);
  }
  console.log(`skills-lock.json matches .agents/skills (${skills.length} skill(s), hashes checked).`);
  process.exit(0);
}

const stale = [];

for (const skill of skills) {
  const from = join(SOURCE, skill);
  if (!existsSync(from)) {
    console.error(`Missing source skill: ${relative(ROOT, from)} (listed in skills-lock.json)`);
    process.exit(1);
  }

  const to = join(TARGET, skill);
  if (isUpToDate(from, to)) continue;
  stale.push(skill);

  if (!check) {
    rmSync(to, { recursive: true, force: true });
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true, dereference: true });
  }
}

// Drop skills this script bridged earlier that are no longer in the lockfile.
const orphans = previouslyBridged().filter(
  (entry) => !skills.includes(entry) && existsSync(join(TARGET, entry)),
);

if (!check) {
  for (const orphan of orphans) rmSync(join(TARGET, orphan), { recursive: true, force: true });
  mkdirSync(TARGET, { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify(skills, null, 2)}\n`);
}

const changes = [
  stale.length ? `synced ${stale.join(', ')}` : null,
  orphans.length ? `pruned ${orphans.join(', ')}` : null,
].filter(Boolean);

if (check) {
  if (changes.length === 0) {
    console.log(`.claude/skills is up to date (${skills.length} skill(s)).`);
  } else {
    console.error(`.claude/skills is stale — would ${changes.join('; ')}.`);
    console.error('Run `pnpm skills:sync` to regenerate it.');
    process.exit(1);
  }
} else if (changes.length === 0) {
  console.log(`.claude/skills already up to date (${skills.length} skill(s)).`);
} else {
  console.log(`.claude/skills: ${changes.join('; ')} (${skills.length} skill(s) bridged).`);
}
