import { describe, expect, it, vi } from 'vitest';
import type { IGRPLayoutDataSource } from '@igrp/framework-next-types';

// Stand-in for React's per-request cache: memoize on argument identity, as `cache` does.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
      const seen: { args: A; result: R }[] = [];
      return (...args: A) => {
        const hit = seen.find((e) => e.args.every((a, i) => Object.is(a, args[i])));
        if (hit) return hit.result;
        const result = fn(...args);
        seen.push({ args, result });
        return result;
      };
    },
  };
});

const { igrpGetLayoutMenus } = await import('../layout-menus.js');

const source = (getMenus = vi.fn(async () => [])) =>
  ({
    getHeaderData: vi.fn(),
    getSidebarData: vi.fn(),
    getMenus,
  }) as unknown as IGRPLayoutDataSource;

describe('igrpGetLayoutMenus', () => {
  it('shares one fetch across separately built config objects', async () => {
    const layoutData = source();
    await igrpGetLayoutMenus({ appCode: 'APP', layoutData, previewMode: false });
    await igrpGetLayoutMenus({ appCode: 'APP', layoutData, previewMode: false });
    expect(layoutData.getMenus).toHaveBeenCalledTimes(1);
  });

  it('fetches again for another app code', async () => {
    const layoutData = source();
    await igrpGetLayoutMenus({ appCode: 'A', layoutData });
    await igrpGetLayoutMenus({ appCode: 'B', layoutData });
    expect(layoutData.getMenus).toHaveBeenCalledTimes(2);
  });

  it('rejects instead of throwing when layoutData is missing', async () => {
    const pending = igrpGetLayoutMenus({ appCode: 'APP' } as never);
    await expect(pending).rejects.toThrow(/layoutData/);
  });
});
