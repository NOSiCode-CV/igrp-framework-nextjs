/**
 * Rewrites relative module specifiers so the emitted `dist/` is loadable by
 * Node's ESM resolver.
 *
 * Every package here declares `"type": "module"`, which means Node applies ESM
 * resolution to `dist/*.js` — and ESM requires a fully specified path. Babel
 * copies specifiers through untouched, so `./components/horizon/button` stays
 * extensionless and Node throws:
 *
 *   ERR_MODULE_NOT_FOUND: Cannot find module '.../dist/components/horizon/button'
 *   imported from '.../dist/index.js'
 *
 * Bundlers (Next, Turbopack, webpack, Vite) do their own extension probing, so
 * this stayed invisible while every consumer went through one. Anything that
 * hands the package to Node directly — a script, a codemod, a native-ESM test
 * runner, `require(esm)` interop — hits it.
 *
 * A specifier is resolved against the *source* tree: `./x` becomes `./x.js` when
 * `x.ts`/`x.tsx` exists beside it, and `./x/index.js` when `x` is a directory.
 * Bare specifiers and anything that already carries an extension are left alone.
 */
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

/** True when the specifier already points at a concrete file. */
function hasKnownExtension(specifier) {
  return /\.(js|mjs|cjs|json|css|svg|png|jpg|jpeg|gif|webp|woff2?)$/i.test(specifier);
}

function resolveSpecifier(specifier, filename) {
  if (!specifier.startsWith('.')) return null;
  if (hasKnownExtension(specifier)) return null;

  const basedir = path.dirname(filename);
  const target = path.resolve(basedir, specifier);

  for (const ext of SOURCE_EXTENSIONS) {
    if (fs.existsSync(target + ext)) return `${specifier}.js`;
  }

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    for (const ext of SOURCE_EXTENSIONS) {
      if (fs.existsSync(path.join(target, `index${ext}`))) {
        return `${specifier.replace(/\/$/, '')}/index.js`;
      }
    }
  }

  return null;
}

module.exports = function addImportExtension() {
  const rewrite = (sourceNode, filename) => {
    if (!sourceNode || typeof sourceNode.value !== 'string') return;
    const rewritten = resolveSpecifier(sourceNode.value, filename);
    if (rewritten) sourceNode.value = rewritten;
  };

  return {
    name: 'add-import-extension',
    visitor: {
      ImportDeclaration(nodePath, state) {
        rewrite(nodePath.node.source, state.file.opts.filename);
      },
      ExportNamedDeclaration(nodePath, state) {
        rewrite(nodePath.node.source, state.file.opts.filename);
      },
      ExportAllDeclaration(nodePath, state) {
        rewrite(nodePath.node.source, state.file.opts.filename);
      },
      // `await import("./x")`
      CallExpression(nodePath, state) {
        if (nodePath.node.callee.type !== 'Import') return;
        const [first] = nodePath.node.arguments;
        if (first && first.type === 'StringLiteral') {
          rewrite(first, state.file.opts.filename);
        }
      },
    },
  };
};
