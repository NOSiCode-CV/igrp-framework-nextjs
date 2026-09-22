# `next build` fails on Windows with EPERM (and the `node:async_hooks` warning)

A build that prints `Compiled successfully`, generates every page, and **then**
exits 1 with `EPERM: operation not permitted, symlink …` is not a code failure.
Diagnosed 2026-09-22.

## The two messages are unrelated — only one of them fails the build

A typical failing run prints both of these, and the first one is **not** the
cause:

```
Turbopack build encountered 1 warnings:
./packages/framework/next/dist/lib/api-config.js:7:1
> 7 | import { AsyncLocalStorage } from 'node:async_hooks';
A Node.js module is loaded ('node:async_hooks') which is not supported in the Edge Runtime.
```

That is a **warning** — the line above it literally says `1 warnings`. It is
deliberate and documented at the top of `api-config.ts`: the `node:` prefix is
used precisely *because* Next's Edge runtime exposes `AsyncLocalStorage` only
under the prefixed form, and a bare `async_hooks` specifier could be shadowed by
an npm package of that name. Turbopack warns about any Node builtin in an Edge
bundle without checking which ones Next itself polyfills. It does not stop the
build and it does not need fixing.

It reaches the middleware bundle through
`src/middleware.ts` → `@/lib/auth` → `@igrp/framework-next` (whose root barrel
re-exports `api-config`).

## The real failure: this account cannot create Windows symlinks

```
> Build error occurred
[Error: EPERM: operation not permitted, symlink
  '…\node_modules\.pnpm\react@19.2.8\node_modules\react'
  -> '…\.next\standalone\templates\demo-v1\node_modules\react']
```

`next.config.ts` sets `output: "standalone"`. After the build succeeds, Next's
file tracer assembles `.next/standalone` — and because pnpm stores real packages
in `node_modules/.pnpm` and links them, that assembly is mostly **symlink**
creation. On Windows, creating a symlink needs either Administrator rights or
Developer Mode. Without them every one fails and the build exits 1.

Confirm it in one command:

```bash
node -e "const fs=require('fs'),os=require('os'),p=require('path');const d=fs.mkdtempSync(p.join(os.tmpdir(),'s-'));fs.writeFileSync(p.join(d,'t'),'x');try{fs.symlinkSync(p.join(d,'t'),p.join(d,'l'));console.log('symlink OK')}catch(e){console.log('symlink FAIL',e.code)}"
```

`symlink FAIL EPERM` confirms it. Two more checks:

```powershell
# Developer Mode (1 = on). Empty/0 means off.
(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' -EA SilentlyContinue).AllowDevelopmentWithoutDevLicense
# Elevated?
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
```

**Proof it is the only thing wrong:** building once with `output: "standalone"`
removed exits **0** with zero EPERM and a full route table. Nothing else in the
app is involved.

## Fix

**Enable Developer Mode** — Settings → System → For developers → Developer Mode
**On**. This grants `SeCreateSymbolicLinkPrivilege` to your normal account; no
elevation needed afterwards. One-time, and it also fixes `git clone` of repos
containing symlinks (this monorepo is developed with `core.symlinks=false` for
the same reason).

Admin PowerShell equivalent:

```powershell
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /t REG_DWORD /f /v AllowDevelopmentWithoutDevLicense /d 1
```

Alternatives, in order of preference:

1. Run the build from an **Administrator** terminal (works, but per-terminal).
2. Skip the standalone output locally. It exists only for the Docker image, and
   that image builds on `node:22-alpine`, where symlinks are unrestricted — so
   Linux CI and `docker build` are unaffected by any of this. Do **not** remove
   `output: "standalone"` from `next.config.ts` to work around a local problem:
   `docker/development/Dockerfile` copies `.next/standalone` and the image will
   not start without it.

## Related, not the same: an intermittent ENOENT

Occasionally the build dies earlier with:

```
[Error: ENOENT: no such file or directory, open
  '…\.next\static\<buildId>\_buildManifest.js.tmp.<random>']
```

Seen twice, and **not reproduced** across repeated consecutive builds
afterwards, so it is not characterised. It is a different phase (writing
`.next/static`, before the standalone trace). If you hit it, `rm -rf .next` and
re-run. Fix the symlink problem above first — that one fails *every* build,
which makes the intermittent one much easier to spot.
