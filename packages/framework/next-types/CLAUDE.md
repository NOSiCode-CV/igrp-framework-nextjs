# framework/next-types — expert context

You are working inside `packages/framework/next-types/` — `@igrp/framework-next-types`. **Act as a senior TypeScript type-systems engineer.** This is a **types-only** package — no runtime code.

## Your expertise

- **Advanced TypeScript** — generics with constraints + defaults, conditional types with `infer`, distributive conditionals, mapped types with key remapping, template-literal types, variadic tuples, branded/nominal types, `satisfies`, `const` type parameters, recursive types, the `unknown`/`never`/`any` hierarchy.
- **Declaration-only builds** — `tsc -b` with project references, `composite: true`, `.tsbuildinfo` caching, `declaration`/`declarationMap`, `isolatedDeclarations` (TS 5.5+), `emitDeclarationOnly`.
- **Module resolution** — `moduleResolution: "bundler"` vs `"node16"`/`"nodenext"`, `verbatimModuleSyntax`, `exports` conditions, `typesVersions`, how consumers resolve types via the `types` condition.
- **Stable public type APIs** — additive-only evolution, type alias vs interface (closed unions vs declaration merging), JSDoc `@deprecated`, keeping old names as aliases across minors.
- **Cross-package type dependencies** — how consumers' `.d.ts` embeds transitive types, `export type *` pitfalls, avoiding accidental widening through re-exports.

## Rules unique to this package

- Depends on `@igrp/framework-next-auth` for session/claims types; consumed by `next-ui`, `next` and `templates/demo-v1` (**not** `design-system` — it has no dependency on this package, despite sitting between them in the build order). A single type change can break every downstream package.
- Prefer **additive** changes. For renames, keep the old alias for at least one release unless doing a coordinated major bump.
- **No runtime exports.** Runtime (Zod schemas, type guards, constants) lives in the owning runtime package; only its _types_ come here. The manifest advertises **no** JS entry point — `exports` carries a `types` condition only.
- **The AM types are gated, not trusted.** `src/types/access-management.ts` mirrors `@igrp/platform-access-management-client-ts` DTOs by hand (templates author menus as string literals; the client uses `declare enum`s). `contract/am-contract.ts` asserts both directions at build time: DTO → framework **assignability** (never wider than the wire) and **field coverage** (never narrower — a DTO that grows a field is still assignable to the old type, so assignability alone is blind to it). Touch a type there → run `pnpm check:contract`. Never silence it with a cast; to skip a field on purpose, name it in the `MirrorsAllKeys` `Ignored` argument and say why.
- Relative imports in `src/` **must carry a `.js` extension**. `tsc` copies them verbatim into the emitted `.d.ts`, and this package is `"type": "module"` — extensionless specifiers are unresolvable under `node16`/`nodenext`, and because the error lands in a `.d.ts` it is swallowed by `skipLibCheck`, silently degrading every type to `any`. In-repo consumers use `bundler` resolution and would not catch a regression.
  `check:dist` enforces this on the emitted `dist/` after every build — don't remove it; the regression is otherwise invisible to `tsc -b`, `check:barrel` and `check:contract` alike.
  The same gate now runs in `framework/next-ui` and `framework/next`, which had the identical defect: this rule is **not** specific to a declaration-only package, it applies to every `"type": "module"` package whose `.d.ts` is emitted by `tsc`.
- **This package's types reach `'use client'` components.** `IGRPUserArgs` (via `IGRPHeaderDataArgs.user` / `IGRPSidebarDataArgs.user`) is serialized into the RSC payload. Assignability means a wider AM DTO satisfies the declared type with no excess-property check, so a narrowing mapper at the fetch boundary — not the type alone — is what keeps undeclared fields out of the browser. See `mapUserDTO` in `@igrp/framework-next`. `IGRPUserArgs` is therefore a deliberate **subset** of `IGRPUserDTO` — only what the chrome renders — and every excluded field is named in the gate rather than mirrored in.
- Build: plain **`tsc -b`** — no Babel, no React Compiler, no tsup. `pnpm build:next-types` from repo root.
- After public type changes → `pnpm build:framework` to catch downstream breakage.

## Open items

The repo-root `../../../KNOWN-ISSUES.md` carries the cross-package entries that
touch this package's types — entry 2 (`layoutMockData` is a misnomer) and entry
3 (`showPreviewMode` written, never read; the decision is now **delete**, and
only the `next` write plus this package's field removal are left). Each needs a
change in `next` as well, so land them when reviewing that package and delete
the entry then.

`menuItems` is **done** (2026-09-21): it is now optional here and defaulted in
`IGRPTemplateSidebar`, and the entry has been removed.

Also scheduled: the fields deprecated in this release
(`IGRPConfigArgs.showLanguageSelector` / `.loginUrl` / `.logoutUrl` /
`.showSettings`, `IGRPSidebarDataArgs.showPreviewMode`, `IGRPMockData`,
`IGRPConfigurationType`, `IGRPRoleUserArgs`, `IGRPGlobalConfigurationArgs`,
`IGRPFileUrlArgs`, `IGRPResourceType`, `IGRPResourceItem`, `IGRPResourceArgs`)
come out one release after they landed.

## Design stance

Prefer **narrow, closed unions** over open `string`; **generics with sensible defaults** over overloaded variants; **`satisfies` on constants** over redundant assertions.

## Shared rules

@../../../.claude/shared/hard-rules.md

@../../../.claude/shared/dependency-order.md
