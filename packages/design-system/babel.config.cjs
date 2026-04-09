const fs = require("fs")

// Plugin options can be found here: https://github.com/facebook/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L38
const ReactCompilerConfig = {
  sources: (filename) => {
    const isInNodeModules = filename.includes("node_modules")
    if (isInNodeModules || (!filename.endsWith(".tsx") && !filename.endsWith(".jsx") && !filename.endsWith(".js"))) {
      return false
    }

    // Skip files that might contain React context or other core React patterns
    const skipPatterns = ["context", "provider", "createContext", "useContext", "exports", "index"]

    const filenameLower = filename.toLowerCase()
    if (skipPatterns.some((pattern) => filenameLower.includes(pattern))) {
      console.log("React compiler - skipping file (contains core React patterns): " + filename)
      return false
    }

    // Only compile files with 'use client' directives. We do not want to
    // accidentally compile React Server Components
    const file = fs.readFileSync(filename, "utf8")
    if (file.includes("'use client'")) {
      return true
    }
    console.log("React compiler - skipping file: " + filename)
    return false
  },
}

module.exports = function (api) {
  api.cache(false)

  return {
    plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
  }
}
