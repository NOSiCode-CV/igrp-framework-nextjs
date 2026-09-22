import { describe, it, expect } from 'vitest';

const { igrpResolveLayoutDataSource } = await import('../layout-data-source.js');

const source = { getHeaderData: async () => ({}), getSidebarData: async () => ({}) } as never;

describe('igrpResolveLayoutDataSource', () => {
  it('prefers the new name', () => {
    const preferred = { ...(source as object) } as never;
    expect(igrpResolveLayoutDataSource({ layoutData: preferred })).toBe(preferred);
  });

  it('falls back to the deprecated name', () => {
    expect(igrpResolveLayoutDataSource({ layoutMockData: source })).toBe(source);
  });

  // No principled winner when the two disagree, so refuse rather than pick.
  it('refuses when both are set', () => {
    expect(() =>
      igrpResolveLayoutDataSource({ layoutData: source, layoutMockData: source }),
    ).toThrowError(/não ambos/);
  });

  it('refuses when neither is set', () => {
    expect(() => igrpResolveLayoutDataSource({})).toThrowError(/obrigatório/);
  });
});
