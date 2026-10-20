// Escape hatch used by every package's `build:without_reactcompiler` script:
// same TypeScript/JSX transform, React Compiler switched off.
const { createBabelConfig } = require('./react-compiler-babel-config.cjs');

module.exports = createBabelConfig({ reactCompiler: false });
