import { defineConfig } from "tsup";

const shared = {
  format: ["esm"] as const,
  dts: false,
  clean: false,
  // No sourcemaps: `files` publishes only dist/, so a shipped .map would point
  // at src/ paths that are not in the tarball — a broken map is worse than none.
  sourcemap: false,
  outDir: "dist",
  splitting: false,
  // Do NOT enable shims — shims inject import statements before the bundle
  // content, which would push the shebang banner off line 1 and cause a
  // SyntaxError in Node's ESM loader. __dirname is handled manually in
  // source files via fileURLToPath(new URL(".", import.meta.url)).
  shims: false,
};

export default defineConfig([
  {
    // CLI binary — src/cli.ts carries the shebang on line 1; tsup preserves it.
    // No banner needed here — adding one would produce a duplicate shebang.
    ...shared,
    entry: { cli: "src/cli.ts" },
  },
  {
    // Public API — no shebang needed.
    ...shared,
    entry: { index: "src/index.ts" },
  },
]);
