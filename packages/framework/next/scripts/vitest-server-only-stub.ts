// `server-only` is a build-time guard, not a runtime module: its real entry
// throws unless the bundler resolves it under the `react-server` condition.
// Vitest runs plain Node, so every test that touched a guarded module had to
// repeat `vi.mock('server-only', () => ({}))`. Aliasing it once in
// `vitest.config.ts` makes the guard free to add anywhere in `src/`.
export {};
