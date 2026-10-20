#!/usr/bin/env node
/**
 * Sync vendored agent skills into `.claude/skills/`.
 *
 * `.agents/skills/` is the canonical, committed home for vendored third-party
 * skills — it is what `skills-lock.json` pins and hashes. `.claude/skills/` is
 * a generated bridge that makes those skills visible to Claude Code; it is
 * gitignored and must never be edited by hand.
 *
 * Real directory copies are used rather than symlinks on purpose: this repo is
 * developed on Windows clones with `core.symlinks=false`, where committed
 * symlinks are materialised as regular files and the bridge silently becomes a
 * second committed copy that can drift past the `skills-lock.json` hash check.
 *
 * Usage:
 *   pnpm run skills:sync                 # regenerate .claude/skills from .agents/skills
 *   pnpm run skills:sync -- --check      # verify the local bridge is current
 *   pnpm run skills:sync -- --verify-lock # verify skills-lock.json against .agents/skills
 *
 * `--check` is for developer machines only: the bridge is gitignored, so a fresh
 * clone has none and --check correctly reports it stale. CI uses --verify-lock,
 * which checks the invariant that survives a clean checkout — every skill named
 * in skills-lock.json has a source directory. Extra directories under
 * .agents/skills/ are fine: a skill can exist without being bridged.
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
} from 'fs';
import path, { join, relative, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = join(ROOT, '.agents', 'skills');
const TARGET = join(ROOT, '.claude', 'skills');
const LOCKFILE = join(ROOT, 'skills-lock.json');

/** Skills listed in skills-lock.json are the ones bridged into .claude/skills. */
function lockedSkills() {
  if (!existsSync(LOCKFILE)) {
    console.error(`skills-lock.json not found at ${relative(ROOT, LOCKFILE)}`);
    process.exit(1);
  }
  return Object.keys(JSON.parse(readFileSync(LOCKFILE, 'utf8')).skills ?? {});
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
const skills = lockedSkills();

// CI mode: only the lockfile <-> source relationship, which a clean checkout has.
if (verifyLock) {
  const missing = skills.filter((s) => !existsSync(join(SOURCE, s)));
  if (missing.length) {
    console.error(`skills-lock.json names skills with no source directory: ${missing.join(', ')}`);
    console.error(`Expected each under ${relative(ROOT, SOURCE).split(path.sep).join('/')}/<name>/.`);
    process.exit(1);
  }
  console.log(`skills-lock.json is consistent with .agents/skills (${skills.length} skill(s)).`);
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

// Drop bridged skills that are no longer in the lockfile.
const orphans = existsSync(TARGET)
  ? readdirSync(TARGET).filter((entry) => !skills.includes(entry))
  : [];

for (const orphan of orphans) {
  if (!check) rmSync(join(TARGET, orphan), { recursive: true, force: true });
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
