/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import preserveUseClientDirective from 'rollup-plugin-preserve-use-client';
import react from '@vitejs/plugin-react';
import { peerDependencies } from './package.json';


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preserveUseClientDirective(),
    libInjectCss(),
    dts({
      include: ['src/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    }),

  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '@igrp/framework-next',
      fileName: (format) => `index.${format}.js`,
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        ...Object.keys(peerDependencies),
        'react/jsx-runtime',
        /^next\//,
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
