/**
 * CJS/ESM default-import interop helper.
 *
 * Problem: this package is published as ESM (`"type": "module"` in
 * package.json) and tsup emits `import X from 'next-auth/...'` statements
 * that webpack under Next.js 15 App Router then has to resolve against the
 * CJS files shipped by `next-auth` v4.
 *
 * The CJS files are written in the legacy shape:
 *
 *   Object.defineProperty(exports, "__esModule", { value: true });
 *   exports.default = Keycloak;
 *
 * Under Node's native ESM-from-CJS rules, `import X from 'next-auth/providers/keycloak'`
 * binds `X` to `module.exports` itself (the namespace object
 * `{ __esModule: true, default: fn }`), NOT to `module.exports.default`.
 * Webpack in Next.js 15 App Router follows the same rule. Calling `X(...)`
 * then throws:
 *
 *   TypeError: next_auth_providers_keycloak__WEBPACK_IMPORTED_MODULE_N__ is not a function
 *
 * `interopDefault()` normalizes both cases:
 *   - bundlers that already unwrapped `.default` → returns the value as-is
 *   - bundlers that handed us the namespace object → returns `.default`
 *
 * Keep this file side-effect-free and dependency-free; it is bundled into
 * every entry that imports it.
 *
 * @internal
 */
export function interopDefault<T>(mod: T): T {
  if (mod && typeof mod === 'object' && 'default' in (mod as object)) {
    return (mod as unknown as { default: T }).default;
  }
  return mod;
}
