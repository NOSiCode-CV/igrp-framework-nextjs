const { createBabelConfig } = require('../../../scripts/react-compiler-babel-config.cjs');

// The package's ONLY JS emitter: one Babel pass over `src/` (TypeScript strip +
// JSX + React Compiler) writing `dist/`. There is no SWC step and no dist input.
// Shared config (directive detection, skip rules) lives in the required file.
module.exports = createBabelConfig();
