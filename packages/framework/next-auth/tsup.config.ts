import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    session: 'src/session.ts',
    jwt: 'src/jwt.ts',
    middleware: 'src/middleware.ts',
  },
  format: ['esm'],
  dts: false, 
  sourcemap: true,
  clean: false,
  treeshake: true,
  splitting: false,
  target: 'es2022',
  platform: 'neutral',
  skipNodeModulesBundle: true,
  external: [
    'react',
    'next',
    'next/server',
    'next-auth',
    'next-auth/react',
    'next-auth/middleware',
    'next-auth/jwt',
  ],
});
