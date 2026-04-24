# Nexus Setup — npm Publishing Auth

**Target Nexus:** Sonatype Nexus Repository OSS 3.70.1-02 at `https://sonatype.nosi.cv/`
**Goal:** make `pnpm publish` work against the `igrp` hosted repository using bearer-token auth, so the monorepo's changesets-driven release flow can publish without relying on `yarn publish`.

This document is split into two parts:

1. **Admin changes** — applied once in the Nexus web UI by whoever owns the Sonatype install at NOSi.
2. **Developer / CI setup** — applied once per machine that publishes.

---

## 1. Admin changes (one-time, ~15 min)

Apply in this order.

### 1.1 Activate the npm Bearer Token Realm

`Administration → Security → Realms`.

Move **`npm Bearer Token Realm`** from Available → Active. Save.

Without this, `npm login` against the npm registry URL cannot issue tokens, and modern `pnpm publish` (pnpm 10.x) will fail PUT requests with `401 ENEEDAUTH` even though reads continue to work.

Verify after save: the Active column should contain both **Local Authenticating Realm** (already there) and **npm Bearer Token Realm**.

### 1.2 Grant the deployer user publish privileges

`Administration → Security → Users → igrp3.0`.

Either edit the user's roles to include a role that already grants `nx-repository-view-npm-igrp-*`, or create a new role:

- `Administration → Security → Roles → Create role → Nexus role`
- **Role ID:** `igrp-npm-deployer`
- **Role name:** `IGRP npm deployer`
- **Privileges:** add `nx-repository-view-npm-igrp-*` (the wildcard privilege, which expands to browse, read, add, edit for the `igrp` npm repository).
- Save the role, then assign it to the user `igrp3.0`.

This is the non-negotiable piece: without `add` and `edit` privileges on the `igrp` hosted repo, any PUT returns 401 regardless of auth method.

### 1.3 Confirm repository deployment policy

`Administration → Repository → Repositories → igrp` (type `npm (hosted)`).

In the **Hosted** section:

- **Deployment policy:** `Allow redeploy`
  - Needed so we can republish the same `-beta.N` version if a publish half-succeeds. Switch to `Allow` (no redeploy) when we cut 1.0.
- **Strict Content Type Validation:** `true` (default; keep).
- **Allow non-SEMVER versions:** `false` (default; keep).

Save.

---

## 2. Developer / CI setup (one-time per machine)

Do these steps after the admin changes above are confirmed.

### 2.1 Log in and get a bearer token

```powershell
npm login --registry=https://sonatype.nosi.cv/repository/igrp/ --scope=@igrp
```

When prompted:

- **Username:** `igrp3.0`
- **Password:** the Nexus password (ask the admin if you don't have it)
- **Email:** anything — Nexus ignores it

On success, npm writes a token to your **user** `.npmrc` (`C:\Users\<name>\.npmrc` on Windows, `~/.npmrc` on Linux/macOS):

```
//sonatype.nosi.cv/repository/igrp/:_authToken=NpA.<long-string>
```

Verify:

```powershell
npm whoami --registry=https://sonatype.nosi.cv/repository/igrp/
```

Should print `igrp3.0`.

### 2.2 Keep the project `.npmrc` minimal

Once token auth is working, the project `.npmrc` should declare only the registry mapping — **no credentials**. See `.npmrc.example` at the repo root.

```
@igrp:registry=https://sonatype.nosi.cv/repository/igrp/
```

The bearer token lives in your user-level `.npmrc`, outside the repo. This keeps the Sonatype password out of git.

### 2.3 CI runners

In GitLab CI (or wherever you run the pipeline), add a CI/CD variable named `NPM_TOKEN` containing the bearer token from step 2.1. Then in the job's `before_script`:

```yaml
before_script:
  - |
    cat > .npmrc <<EOF
    @igrp:registry=https://sonatype.nosi.cv/repository/igrp/
    //sonatype.nosi.cv/repository/igrp/:_authToken=${NPM_TOKEN}
    EOF
```

This writes a temporary `.npmrc` with the token for the duration of the job. Token rotation is as simple as updating the CI variable — no repo change needed.

---

## 3. Release flow after setup

With the above in place, cutting a new beta is:

```powershell
pnpm changeset          # record intent (one per meaningful change)
pnpm release:all        # bump versions → build → publish all changed packages
```

Internally `release:all` runs:

1. `changeset version` — bumps `package.json` versions, regenerates `CHANGELOG.md`, consumes `.changeset/*.md`.
2. `pnpm build:framework` — builds every framework package in dependency order.
3. `changeset publish` — calls `pnpm publish` per changed package in topological order. Each tarball has `workspace:*` rewritten to concrete versions automatically.

Everything respects `publishConfig.registry` in each `package.json`, so the right hosted URL is used.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `npm login` → 401 | `npm Bearer Token Realm` not active | Admin applies §1.1 |
| `npm login` → 200 but `publish` → 401 | User missing `add`/`edit` privileges | Admin applies §1.2 |
| `publish` → 400 with "non-SEMVER" | Version has a non-semver suffix (e.g. `0.1.0-beta.113-2`) | Bump to clean semver (`0.1.0-beta.114`); changesets handles this automatically going forward |
| `publish` → 409 "version already exists" on the same `-beta.N` | Deployment policy is `Disable redeploy` | Admin applies §1.3 (set to `Allow redeploy`), or bump to a new beta counter |
| Token expires silently | Rotation on Nexus side | Re-run §2.1 |

---

## 5. Rollback

If Flow A breaks for any reason, the fallback is the existing per-package `release` script that uses `yarn publish`:

```powershell
cd packages/framework/next-auth
pnpm run release
```

Those scripts remain intact intentionally so you have a known-good manual path while transitioning.
