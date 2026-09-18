import { describe, it, expect, beforeEach } from 'vitest';
import { globalSlot, warnOnce, resetGlobalStateForTests } from '../_global-state';

beforeEach(() => {
  resetGlobalStateForTests();
});

describe('globalSlot', () => {
  it('returns the same value for the same key', () => {
    const a = globalSlot('t.map', () => new Map<string, number>());
    const b = globalSlot('t.map', () => new Map<string, number>());
    expect(a).toBe(b);
    a.set('x', 1);
    expect(b.get('x')).toBe(1);
  });

  it('survives a module reload, which is the whole point', async () => {
    // tsup inlines a module into every entry chunk that imports it, so the
    // `/config` and `/oidc` copies are different module instances in one
    // process. A fresh import is the closest stand-in for that.
    globalSlot('t.survives', () => new Map<string, number>()).set('k', 7);
    // Non-literal specifier: the cache-busting query is a Vite/Vitest feature,
    // and keeping it out of the literal stops tsc trying to resolve it.
    const specifier = '../_global-state?reload';
    const reimported = (await import(
      /* @vite-ignore */ specifier
    )) as typeof import('../_global-state');
    const seen = reimported.globalSlot('t.survives', () => new Map<string, number>());
    expect(seen.get('k')).toBe(7);
  });

  it('does not re-run create() once the slot exists', () => {
    let calls = 0;
    const create = () => {
      calls += 1;
      return { v: calls };
    };
    globalSlot('t.once', create);
    globalSlot('t.once', create);
    expect(calls).toBe(1);
  });

  it('keeps distinct keys distinct', () => {
    expect(globalSlot('t.a', () => ({}))).not.toBe(globalSlot('t.b', () => ({})));
  });

  it('holder objects let a value be replaced for every reader', () => {
    // How the token recovery store is swapped at startup.
    const holder = globalSlot('t.holder', () => ({ store: 'default' }));
    holder.store = 'replaced';
    expect(globalSlot('t.holder', () => ({ store: 'default' })).store).toBe('replaced');
  });
});

describe('warnOnce', () => {
  it('runs the warning exactly once per key', () => {
    let calls = 0;
    expect(warnOnce('t.warn', () => calls++)).toBe(true);
    expect(warnOnce('t.warn', () => calls++)).toBe(false);
    expect(calls).toBe(1);
  });

  it('tracks keys independently', () => {
    const seen: string[] = [];
    warnOnce('t.w1', () => seen.push('one'));
    warnOnce('t.w2', () => seen.push('two'));
    expect(seen).toEqual(['one', 'two']);
  });
});

describe('resetGlobalStateForTests', () => {
  it('clears only this package namespace', () => {
    const foreign = Symbol.for('some.other.library.slot');
    (globalThis as unknown as Record<symbol, unknown>)[foreign] = 'keep me';
    globalSlot('t.mine', () => 'drop me');

    resetGlobalStateForTests();

    expect((globalThis as unknown as Record<symbol, unknown>)[foreign]).toBe('keep me');
    expect(globalSlot('t.mine', () => 'recreated')).toBe('recreated');
    delete (globalThis as unknown as Record<symbol, unknown>)[foreign];
  });
});
