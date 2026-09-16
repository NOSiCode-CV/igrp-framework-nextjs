/**
 * Shared Babel configuration for the packages that compile React sources:
 * `design-system`, `framework/next-ui`, `framework/next`.
 *
 * Babel is the *only* JS emitter for these packages. It reads `src/` and writes
 * `dist/` in a single pass: strip TypeScript, transform JSX, and run the React
 * Compiler.
 *
 * Why not SWC in front of it: `babel-plugin-react-compiler` has no SWC
 * equivalent, so a Babel pass is unavoidable. Running SWC first only meant the
 * compiler analysed *generated* output rather than the code as written — which
 * is how a quote-sensitivity bug in the `use client` gate went unnoticed long
 * enough to disable memoization across the whole design system. One pass over
 * `src/` removes the intermediate `dist_optimized` directory and the
 * `swap-dist.mjs` rename dance with it.
 *
 * The Babel toolchain is pinned to **7.x on purpose**. `babel-plugin-react-compiler`
 * (through 1.0.0) is built against the Babel 7 AST, and under `@babel/core` 8 its
 * HIR lowering fails on every destructured parameter that carries a default value:
 *
 *   function Foo({ a = 1 }) {}
 *   -> CompileError: (BuildHIR::lowerAssignment) Expected object property value
 *      to be an LVal, got: AssignmentPattern
 *
 * The compiler swallows those errors per function and emits the original code, so
 * the build stays green while memoization silently disappears from most of the
 * package. On Babel 8 that was 443 bailouts across 71 design-system files. Do not
 * bump `@babel/*` to 8 until the compiler ships Babel 8 support — and if you do,
 * check the memoized-module count, not just that the build passes.
 *
 * Deliberately NO `@babel/preset-env`: output must stay untouched ESM at
 * esnext, matching what the old `.swcrc` emitted. Consumers (Next/Turbopack)
 * do the downleveling.
 *
 * Plugin options: https://github.com/facebook/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts
 */
const fs = require('node:fs');

/**
 * Matches a `use client` directive regardless of quote style.
 *
 * Quote style differs per package — `design-system` formats with Prettier
 * `singleQuote: false`, `next-ui` / `next` with `singleQuote: true` — and a
 * literal `includes("'use client'")` check silently matched nothing in
 * `design-system`, disabling the React Compiler for that entire package
 * without failing the build. Keep this quote-agnostic.
 */
const USE_CLIENT_DIRECTIVE = /^\s*(['"])use client\1\s*;?\s*$/m;

/**
 * Files that create React context are left uncompiled.
 *
 * Previously this was a substring test against the whole file *path*
 * (`context`, `provider`, `index`, ...), which excluded every barrel file and
 * everything under a `providers/` directory whether or not it defined a
 * context. Testing the file contents matches the original intent without the
 * collateral damage.
 *
 * Per-file opt-out for anything else is the compiler's own `"use no memo"`
 * directive, which the source files already use where needed.
 */
const CREATES_CONTEXT = /\bcreateContext\s*[<(]/;

const COMPILABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const createReactCompilerConfig = ({ verbose = false } = {}) => ({
  sources: (filename) => {
    if (filename.includes('node_modules')) return false;
    if (!COMPILABLE_EXTENSIONS.some((ext) => filename.endsWith(ext))) return false;

    const file = fs.readFileSync(filename, 'utf8');

    // Only compile client modules. Compiling a React Server Component is
    // both pointless and unsafe.
    if (!USE_CLIENT_DIRECTIVE.test(file)) {
      if (verbose) console.log('React compiler - skipping (not a client module): ' + filename);
      return false;
    }

    if (CREATES_CONTEXT.test(file)) {
      if (verbose) console.log('React compiler - skipping (defines React context): ' + filename);
      return false;
    }

    return true;
  },
});

/**
 * Babel config factory shared by every React package in this repo.
 *
 * `reactCompiler: false` powers the `build:without_reactcompiler` escape hatch
 * via `scripts/babel-config.no-react-compiler.cjs`. It is a separate config
 * file rather than an env var because `VAR=x cmd` is not portable to the
 * Windows shells pnpm runs scripts in.
 *
 * `development: false` is pinned deliberately. On `@babel/preset-react` 7 it is
 * already the default, so today it changes nothing — but on 8 the flag follows
 * `api.env()` instead, and the build scripts set no `NODE_ENV`, so Babel
 * resolves the env to "development" and every package emits
 * `react/jsx-dev-runtime` imports in place of `react/jsx-runtime`. That is a
 * silent regression: the build stays green and the dev runtime resolves fine,
 * the published package just runs dev-only element validation in production for
 * every component. Measured on 8.0.1: 159 of the design system's 184 emitted
 * modules. Keep the pin so a future Babel 8 bump cannot reintroduce it.
 */
const createBabelConfig = ({ reactCompiler = true, ...options } = {}) => (api) => {
  api.cache(false);

  return {
    presets: [
      '@babel/preset-typescript',
      ['@babel/preset-react', { runtime: 'automatic', development: false }],
    ],
    plugins: reactCompiler
      ? [['babel-plugin-react-compiler', createReactCompilerConfig(options)]]
      : [],
  };
};

module.exports = { createBabelConfig, createReactCompilerConfig };
