# Runbook: scrub the leaked Sonatype credential from git history

## What happened

The root `.npmrc` committed a real NOSi Sonatype registry credential
(`//sonatype.nosi.cv/repository/igrp/:_password=…` + `username=igrp3.0`). The
file was added long ago (`c03ce79b`) and the secret persisted across ~12 commits;
that history is reachable from ~24 branches (including `main`).

The **working-tree** file has since been scrubbed on both long-lived branches —
the root `.npmrc` now ships only the `@igrp` registry scoping + `always-auth`
(`dev`: commit `778c4f2e`; `main`: commit `7b17fd2d`). But the secret still
exists in **git history** and in every clone anyone already has.

## STEP 0 — ROTATE FIRST (urgent; do this before anything else)

Rotate/disable the `igrp3.0` Sonatype account password on the registry server.
**This is the only step that actually neutralizes the exposure** — it kills the
leaked credential in all history and in every existing clone at once. Everything
below is optional hygiene on a now-dead secret. Do **not** skip rotation in
favour of the history rewrite.

## STEP 1 — decide whether the history rewrite is needed

After rotation the secret is dead. A history rewrite only removes the dead string
from history (tidiness / passing secret scanners). It is a **destructive,
team-wide** operation — only do it if policy requires clean history.

## STEP 2 — prerequisites

- Tooling (none currently installed): `pip install git-filter-repo` (recommended)
  or BFG Repo-Cleaner (needs Java).
- Freeze the repo: have everyone push/merge WIP, then stop pushing.
- Work from a fresh **mirror** clone:
  `git clone --mirror http://git.nosi.cv/igrp-3_0/igrp-framework-frontend/igrp-framework-nextjs.git`
- Back it up first: copy the mirror dir, or `git bundle create backup.bundle --all`.

## STEP 3 — rewrite (redact the secret across ALL refs)

Create `replacements.txt` (do **not** commit it). Put the leaked values on their
own lines — extract the password from history, e.g. `git show c03ce79b:.npmrc`:

```
<leaked-base64-password>
igrp3.0
```

Each listed string is replaced with `***REMOVED***`. Then, inside the mirror:

```
git filter-repo --replace-text /abs/path/replacements.txt --force
```

`git filter-repo` rewrites every branch and tag by default. (BFG equivalent:
`bfg --replace-text replacements.txt` then `git reflog expire --expire=now --all && git gc --prune=now --aggressive`.)

## STEP 4 — verify

```
git grep -I "igrp3.0" $(git rev-list --all) || echo "clean"
git log --all -- .npmrc   # .npmrc still present; secret gone from its blobs
```

## STEP 5 — publish the rewritten history (DESTRUCTIVE, coordinated)

`filter-repo` drops the remote; re-add and force-push everything:

```
git remote add origin http://git.nosi.cv/igrp-3_0/igrp-framework-frontend/igrp-framework-nextjs.git
git push --force --all origin
git push --force --tags origin
```

This rewrites `main`, `dev`, and ~22 other branches on the server.

## STEP 6 — everyone re-clones

All existing clones are now incompatible. Every collaborator must delete their
clone and re-clone (or hard-reset every branch to the new origin). Open PRs built
on old SHAs will need to be recreated. Delete `replacements.txt` when done.

## Prevention (already in place)

- Root `.npmrc` ships only the `@igrp` scoping; auth lives in the user npmrc
  (`%USERPROFILE%\.npmrc`) or the root `.env` (`NPM_REGISTRY_USERNAME` /
  `NPM_REGISTRY_PASSWORD`) consumed by `pnpm install:deps`. See
  `.env.npmrc.example`.
- Consider a secret-scanning pre-commit hook / CI check so an auth line can never
  be committed to `.npmrc` again.
