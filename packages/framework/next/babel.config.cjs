const { createBabelConfig } = require('../../../scripts/react-compiler-babel-config.cjs');

// React Compiler pass over the SWC output in `dist/`.
// Shared config (directive detection, skip rules) lives in the required file.
module.exports = createBabelConfig();
