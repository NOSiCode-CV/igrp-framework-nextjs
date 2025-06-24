/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import preserveUseClientDirective from "rollup-plugin-preserve-use-client";
import { peerDependencies } from "./package.json";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    libInjectCss(),
    preserveUseClientDirective(),
    dts({
      include: ["src"],
      exclude: ["**/*.stories.tsx", "src/test", "**/*.test.tsx"],
      // rollupTypes: true,
      outDir: 'dist',
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        server: path.resolve(__dirname, 'src/server.ts'),
      },
      name: "IGRPFrameworkNext",
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      formats: ["cjs", "es"],
    },
    rollupOptions: {
      external: [
        ...Object.keys(peerDependencies),
        "react/jsx-runtime",
        /^next\//,
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
