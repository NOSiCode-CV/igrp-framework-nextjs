# Upgrading your app with `@igrp/template-migrator`

When a new IGRP Framework version ships, this CLI applies all the required source changes to your app automatically — new files, updated middleware, dependency bumps, and `.env` additions.

No permanent install is needed. Run it on demand with `pnpm dlx` or `npx`.

---

## Install / run

```bash
# Check what needs upgrading
pnpm dlx @igrp/template-migrator@latest status

# Preview changes (no files are written)
pnpm dlx @igrp/template-migrator@latest plan

# Apply all pending migrations
pnpm dlx @igrp/template-migrator@latest apply
```

---

## Commands

### `status` — see where you stand

```bash
pnpm dlx @igrp/template-migrator@latest status
```

```
Template: demo-legacy  CLI: 0.1.0-beta.115

  ✓ applied  01-preview-mode-not-found
  ✓ applied  02-access-sync-config-refactor
  • pending  03-tailwind-v4-tokens
  • pending  04-multi-auth-provider
  • pending  05-edge-safe-auth-bypass
  • pending  06-error-handling-overhaul

2 applied, 4 pending
```

- **✓ applied** — already done, will be skipped.
- **• pending** — will be processed on the next `apply`.

---

### `plan` — preview without writing

```bash
pnpm dlx @igrp/template-migrator@latest plan
```

Prints every file operation each pending migration will perform. Nothing is written to disk — safe to run at any time.

```
Pending migrations (4):

── 03-tailwind-v4-tokens ──────────────────────────────────────
  file.write  src/styles/globals.css  (replace)

── 04-multi-auth-provider ─────────────────────────────────────
  file.write  src/lib/auth.ts  (replace)
  file.write  src/middleware.ts  (replace)
  file.create src/actions/igrp/auth.ts
  file.write  src/actions/igrp/layout.ts  (replace)
  file.write  src/app/(auth)/login/page.tsx  (replace)
  file.create src/app/api/auth/[...nextauth]/route.ts
  env.add     .env.example  →  AUTH_PROVIDER, KEYCLOAK_*, AUTENTIKA_*

── 05-edge-safe-auth-bypass ───────────────────────────────────
  file.write  src/middleware.ts  (replace)
  file.create src/lib/utils.ts
  ...

── 06-error-handling-overhaul ─────────────────────────────────
  file.write  src/lib/auth.ts  (replace)
  file.create src/lib/report-error.ts
  file.create src/config/error-messages.ts
  ...

No files were written.
```

---

### `apply` — run the migrations

```bash
pnpm dlx @igrp/template-migrator@latest apply
```

The CLI walks through each pending migration in order. For each step it shows what it is about to do and asks for confirmation before writing. After each completed migration it records an entry in `.igrpmigrations/lock.json` — so if the run is interrupted you can re-run `apply` and it will resume from where it stopped.

When done, if any `package.json` dependency was bumped the CLI prints:

```
Next steps:
  pnpm install
```

Run `pnpm install` whenever that message appears.

#### Skip prompts — CI / scripted runs

```bash
pnpm dlx @igrp/template-migrator@latest apply --yes
```

#### Apply only up to a specific migration

```bash
pnpm dlx @igrp/template-migrator@latest apply --to 04-multi-auth-provider
```

---

### `list` — show all migrations bundled in this CLI version

```bash
pnpm dlx @igrp/template-migrator@latest list
```

---

### `rollback` — undo the last applied migration

```bash
pnpm dlx @igrp/template-migrator@latest rollback 04-multi-auth-provider
```

Restores the files that migration wrote and removes its entry from the lock file.

---

### `check` — CI gate

```bash
pnpm dlx @igrp/template-migrator@latest check
```

Exits with code `1` if any migration is pending, `0` if everything is up to date. Add it to your pipeline:

```yaml
- name: Check for pending IGRP migrations
  run: pnpm dlx @igrp/template-migrator@latest check
```

---

## The lock file

After each successful migration `apply` writes `.igrpmigrations/lock.json` to your project root. **Commit this file.** It is the source of truth for which migrations your app has applied — re-running `apply` always skips completed entries.

---

## Migration history

| # | ID | What changed | Target framework |
|---|---|---|---|
| 01 | `01-preview-mode-not-found` | Preview mode bypass, custom 404 | — |
| 02 | `02-access-sync-config-refactor` | Access Management sync, config helpers | beta.84 |
| 03 | `03-tailwind-v4-tokens` | Tailwind v4 `@source` / token-only imports | — |
| 04 | `04-multi-auth-provider` | Multi-provider auth (`AUTH_PROVIDER`), central `auth.ts` | beta.113 |
| 05 | `05-edge-safe-auth-bypass` | Edge-safe auth refactor, `isAuthBypass()` unification | beta.114 |
| 06 | `06-error-handling-overhaul` | Typed error hierarchy, full App Router error boundaries | beta.115 |

Full prose guides with before/after code: [`.igrpmigrations/`](.igrpmigrations/)

---

## Troubleshooting

**Partially applied migration** — re-run `apply`. The lock file tracks the last completed migration, so only the interrupted one retries from the start.

**Build fails after applying** — roll back, check the prose guide in `.igrpmigrations/` for manual steps your app may need, then re-apply:

```bash
pnpm dlx @igrp/template-migrator@latest rollback <id>
# make any manual adjustments
pnpm dlx @igrp/template-migrator@latest apply --to <id>
```

**Lock file missing but migrations were already applied** — re-run `apply`. Overwrites are idempotent (same content), then the lock entries are written correctly.
