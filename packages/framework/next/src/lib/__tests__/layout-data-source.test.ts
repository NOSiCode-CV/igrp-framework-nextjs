import { describe, it, expect } from 'vitest';

const { igrpResolveLayoutDataSource } = await import('../layout-data-source.js');

const source = { getHeaderData: async () => ({}), getSidebarData: async () => ({}) } as never;

describe('igrpResolveLayoutDataSource', () => {
  it('returns layoutData', () => {
    expect(igrpResolveLayoutDataSource({ layoutData: source })).toBe(source);
  });

  it('refuses when layoutData is missing', () => {
    expect(() => igrpResolveLayoutDataSource({} as never)).toThrowError(/obrigatório/);
  });
});
