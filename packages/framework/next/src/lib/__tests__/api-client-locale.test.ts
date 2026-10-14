import { beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn(() => ({ marker: 'client' }));
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: { create },
}));
const getConfig = vi.fn();
vi.mock('../api-config.js', () => ({
  igrpGetAccessClientConfig: () => getConfig(),
  igrpResetAccessClientConfig: vi.fn(),
}));

const { igrpGetAccessClient } = await import('../api-client.js');

beforeEach(() => create.mockClear());

describe('igrpGetAccessClient headers', () => {
  it('adds Accept-Language when the config carries a locale', () => {
    getConfig.mockReturnValue({ baseUrl: 'http://am', token: 'T', locale: 'fr' });
    igrpGetAccessClient();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: 'Bearer T', 'Accept-Language': 'fr' },
      }),
    );
  });

  it('sends only Authorization without a locale', () => {
    getConfig.mockReturnValue({ baseUrl: 'http://am', token: 'T' });
    igrpGetAccessClient();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer T' } }),
    );
  });
});
