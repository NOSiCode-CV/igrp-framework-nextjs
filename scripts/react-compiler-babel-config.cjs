/**
 * Shared React Compiler (Babel) configuration for the SWC+Babel packages:
 * `design-system`, `framework/next-ui`, `framework/next`.
 *
 * This pass runs over `dist/` — the *SWC output*, not `src/` — because
 * `babel-plugin-react-compiler` has no SWC equivalent. Everything it sees is
 * therefore already-transpiled `.js`.
 *
 * Plugin options: https://github.com/facebook/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts
 */
const fs = require('node:fs');

/**
 * Matches a `use client` directive regardless of quote style.
 *
 * SWC preserves the source's quote characters, and the packages disagree:
 * `design-system` formats with Prettier `singleQuote: false` (`"use client"`)
 * while `next-ui` / `next` use `singleQuote: true` (`'use client'`). A literal
 * `includes("'use client'")` check silently matched nothing in `design-system`,
 * disabling the React Compiler for that entire package without failing the
 * build. Keep this quote-agnostic.
 */
const USE_CLIENT_DIRECTIVE = /^\s*(['"])use client\1\s*;?\s*$/m;

/**
 * Files that create React context are left uncompiled.
 *
 * Previously this was a substring test against the whole file *path*
 * (`context`, `provider`, `index`, ...), which excluded every `index.js`
 * barrel and every file under a `providers/` directory whether or not it
 * defined a context. Testing the file contents matches the original intent
 * without the collateral damage.
 *
 * Per-file opt-out for anything else is the compiler's own `"use no memo"`
 * directive, which the source files already use where needed.
 */
const CREATES_CONTEXT = /\bcreateContext\s*[<(]/;

const COMPILABLE_EXTENSIONS = ['.tsx', '.jsx', '.js'];

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

/** Babel config factory shared by every SWC+Babel package in this repo. */
const createBabelConfig = (options) => (api) => {
  api.cache(false);

  return {
    plugins: [['babel-plugin-react-compiler', createReactCompilerConfig(options)]],
  };
};

module.exports = { createBabelConfig, createReactCompilerConfig };
