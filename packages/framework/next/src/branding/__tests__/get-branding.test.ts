import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGlobalConfiguration = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@igrp/platform-access-management-client-ts')>();
  return {
    ...actual,
    AccessManagementClient: { create: () => ({ globalConfiguration: { getGlobalConfiguration } }) },
  };
});

const { igrpGetBranding, igrpInvalidateBranding, igrpResetBrandingCache } =
  await import('../get-branding.js');

const BASE = 'https://am.example';
const doc = (color: string) =>
  JSON.stringify({ version: 1, tokens: { light: { '--primary': color } }, logos: {} });
const ok = (color: string) => ({ data: { config: doc(color), type: 'ORGANIZATION' } });

beforeEach(() => {
  igrpResetBrandingCache();
  getGlobalConfiguration.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-13T10:00:00Z'));
});

describe('igrpGetBranding', () => {
  it('fetches on the first signed-in request and returns the parsed Brand', async () => {
    getGlobalConfiguration.mockResolvedValue(ok('oklch(0.45 0.18 250)'));
    const brand = await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(brand?.tokens.light).toEqual({ '--primary': 'oklch(0.45 0.18 250)' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(1);
  });

  it('serves a fresh entry without fetching again', async () => {
    getGlobalConfiguration.mockResolvedValue(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(1);
  });

  it('never fetches without a token (public pages), and returns null when nothing is cached', async () => {
    const brand = await igrpGetBranding({ baseUrl: BASE });
    expect(brand).toBeNull();
    expect(getGlobalConfiguration).not.toHaveBeenCalled();
  });

  it('caches a 404 as no Brand for the TTL', async () => {
    getGlobalConfiguration.mockRejectedValue(
      Object.assign(new Error('not found'), { status: 404 }),
    );
    expect(await igrpGetBranding({ baseUrl: BASE, token: 't' })).toBeNull();
    expect(await igrpGetBranding({ baseUrl: BASE, token: 't' })).toBeNull();
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(1);
  });

  it('keeps the previous Brand on a server error and waits 60 s before retrying', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    vi.setSystemTime(new Date('2026-10-13T10:06:00Z'));
    getGlobalConfiguration.mockRejectedValue(Object.assign(new Error('down'), { status: 503 }));
    expect((await igrpGetBranding({ baseUrl: BASE, token: 't' }))?.tokens.light).toEqual({
      '--primary': 'red',
    });
    expect((await igrpGetBranding({ baseUrl: BASE, token: 't' }))?.tokens.light).toEqual({
      '--primary': 'red',
    });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-10-13T10:07:01Z'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(3);
  });

  it('serves the stale value immediately and refreshes in the background after the TTL', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    vi.setSystemTime(new Date('2026-10-13T10:06:00Z'));
    getGlobalConfiguration.mockResolvedValueOnce(ok('blue'));
    const stale = await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(stale?.tokens.light).toEqual({ '--primary': 'red' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(2);
    // The background refresh completes later; poll until the cache holds the new value.
    await vi.waitFor(async () => {
      const fresh = await igrpGetBranding({ baseUrl: BASE, token: 't' });
      expect(fresh?.tokens.light).toEqual({ '--primary': 'blue' });
    });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(2);
  });

  it('refetches when the freshness cookie is newer than the cached entry', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    getGlobalConfiguration.mockResolvedValueOnce(ok('green'));
    const savedAt = Date.now() + 1000;
    await igrpGetBranding({ baseUrl: BASE, token: 't', savedAt });
    await vi.waitFor(() => expect(getGlobalConfiguration).toHaveBeenCalledTimes(2));
  });

  it('forgets the entry after invalidate', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red')).mockResolvedValueOnce(ok('blue'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    igrpInvalidateBranding(BASE);
    const brand = await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(brand?.tokens.light).toEqual({ '--primary': 'blue' });
  });
});
