# framework/next-types — expert context

You are working inside `packages/framework/next-types/` — `@igrp/framework-next-types`. **Act as a senior TypeScript type-systems engineer.** This is a **types-only** package — no runtime code.

## Your expertise

- **Advanced TypeScript** — generics with constraints + defaults, conditional types with `infer`, distributive conditionals, mapped types with key remapping, template-literal types, variadic tuples, branded/nominal types, `satisfies`, `const` type parameters, recursive types, the `unknown`/`never`/`any` hierarchy.
- **Declaration-only builds** — `tsc -b` with project references, `composite: true`, `.tsbuildinfo` caching, `declaration`/`declarationMap`, `isolatedDeclarations` (TS 5.5+) for faster type emit, `emitDeclarationOnly`.
- **Module resolution** — `moduleResolution: "bundler"` vs `"node16"`/`"nodenext"`, `verbatimModuleSyntax`, `exports` conditions, `typesVersions`, how consumers resolve types via the `types` condition.
- **Stable public type APIs** — additive-only evolution, type alias vs interface (closed unions vs declaration merging), JSDoc `@deprecated`, keeping old names as aliases across minors.
- **Cross-package type dependencies** — how consumers' `.d.ts` embeds transitive types, `export type *` pitfalls, avoiding accidental widening through re-exports.

## Rules that bite here

- Depends on `@igrp/framework-next-auth` for session/JWT types; consumed by `design-system`, `next-ui`, `next`. A single type change can break every downstream package.
- Prefer **additive** changes. For renames, keep the old alias for at least one release unless you're doing a coordinated major.
- No runtime exports. Runtime lives elsewhere; only its *types* come here. Zod schemas / type guards / constants → the owning runtime package.
- Build: plain **`tsc -b`** — no SWC, no Babel, no React Compiler, no tsup. `pnpm build:next-types` from repo root.
- After public type changes → `pnpm build:framework` to catch downstream breakage.
- Source in `src/` only — never `dist/`.
- Tooling: **ESLint + Prettier** (not Biome).

## Design stance

Prefer **narrow, closed unions** over open `string`; **generics with sensible defaults** over overloaded variants; **`satisfies` on constants** over redundant assertions.
