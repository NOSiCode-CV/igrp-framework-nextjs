import { describe, it, expect } from 'vitest';
import {
  getAuthProviderIdFromEnv,
  assertAuthProviderEnv,
  getMissingAuthProviderEnvVars,
  getAuthProviderDiscoveryUrl,
  createAuthProviderFromEnv,
  isAuthEnabled,
  isAuthDisabled,
  OAUTH2_PROVIDER_ID,
  NONE_PROVIDER_ID,
  AUTH_PROVIDER_IDS,
} from '../providers';

const VALID_OAUTH2_ENV = {
  AUTH_PROVIDER: 'oauth2',
  OAUTH2_CLIENT_ID: 'igrp-example',
  OAUTH2_CLIENT_SECRET: 'psw',
  OAUTH2_ISSUER: 'http://localhost:9090',
};

describe('getAuthProviderIdFromEnv', () => {
  it('returns oauth2 when AUTH_PROVIDER=oauth2', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'oauth2' })).toBe('oauth2');
  });

  it('defaults to oauth2 when AUTH_PROVIDER is not set', () => {
    expect(getAuthProviderIdFromEnv({})).toBe('oauth2');
  });

  it('returns none when AUTH_PROVIDER=none', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'none' })).toBe('none');
  });

  it('is case-insensitive', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'OAUTH2' })).toBe('oauth2');
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'NONE' })).toBe('none');
  });

  it('throws for unknown provider', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'keycloak' })).toThrow(
      'Unsupported AUTH_PROVIDER "keycloak"',
    );
  });

  it('throws for autentika (removed provider)', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'autentika' })).toThrow(
      'Unsupported AUTH_PROVIDER "autentika"',
    );
  });
});

describe('getMissingAuthProviderEnvVars', () => {
  it('returns missing keys for oauth2 when env is empty', () => {
    const missing = getMissingAuthProviderEnvVars({}, 'oauth2');
    expect(missing).toEqual(['OAUTH2_CLIENT_ID', 'OAUTH2_CLIENT_SECRET', 'OAUTH2_ISSUER']);
  });

  it('returns empty array when all oauth2 vars are present', () => {
    const missing = getMissingAuthProviderEnvVars(VALID_OAUTH2_ENV, 'oauth2');
    expect(missing).toEqual([]);
  });

  it('returns empty array for none provider (no required vars)', () => {
    const missing = getMissingAuthProviderEnvVars({}, 'none');
    expect(missing).toEqual([]);
  });
});

describe('assertAuthProviderEnv', () => {
  it('does not throw when all oauth2 vars are present', () => {
    expect(() => assertAuthProviderEnv(VALID_OAUTH2_ENV)).not.toThrow();
  });

  it('throws when OAUTH2_CLIENT_ID is missing', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_CLIENT_ID: undefined };
    expect(() => assertAuthProviderEnv(env)).toThrow('OAUTH2_CLIENT_ID');
  });

  it('throws when OAUTH2_CLIENT_SECRET is missing', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_CLIENT_SECRET: '' };
    expect(() => assertAuthProviderEnv(env)).toThrow('OAUTH2_CLIENT_SECRET');
  });

  it('throws when OAUTH2_ISSUER is missing', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_ISSUER: undefined };
    expect(() => assertAuthProviderEnv(env)).toThrow('OAUTH2_ISSUER');
  });

  it('does not throw for none provider regardless of env', () => {
    expect(() => assertAuthProviderEnv({ AUTH_PROVIDER: 'none' })).not.toThrow();
  });
});

describe('getAuthProviderDiscoveryUrl', () => {
  it('appends /.well-known/openid-configuration to OAUTH2_ISSUER', () => {
    const url = getAuthProviderDiscoveryUrl(VALID_OAUTH2_ENV);
    expect(url).toBe('http://localhost:9090/.well-known/openid-configuration');
  });

  it('strips trailing slash from OAUTH2_ISSUER before appending', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_ISSUER: 'http://localhost:9090/' };
    expect(getAuthProviderDiscoveryUrl(env)).toBe(
      'http://localhost:9090/.well-known/openid-configuration',
    );
  });

  it('returns empty string for none provider', () => {
    expect(getAuthProviderDiscoveryUrl({ AUTH_PROVIDER: 'none' })).toBe('');
  });
});

describe('createAuthProviderFromEnv', () => {
  it('returns an OAuthConfig with correct id for oauth2', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV);
    expect(provider).not.toBeNull();
    expect((provider as { id: string }).id).toBe('oauth2');
  });

  it('sets wellKnown from OAUTH2_ISSUER', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV) as { wellKnown: string };
    expect(provider.wellKnown).toBe('http://localhost:9090/.well-known/openid-configuration');
  });

  it('sets default scope to openid when OAUTH2_SCOPES is not set', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid');
  });

  it('uses OAUTH2_SCOPES when provided', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_SCOPES: 'openid profile email' };
    const provider = createAuthProviderFromEnv(env) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid profile email');
  });

  it('returns null for none provider', () => {
    expect(createAuthProviderFromEnv({ AUTH_PROVIDER: 'none' })).toBeNull();
  });

  it('wires clientId and clientSecret from env into the provider', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV) as {
      clientId: string;
      clientSecret: string;
    };
    expect(provider.clientId).toBe('igrp-example');
    expect(provider.clientSecret).toBe('psw');
  });
});

describe('isAuthEnabled / isAuthDisabled', () => {
  it('isAuthEnabled returns true for oauth2', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: 'oauth2' })).toBe(true);
  });

  it('isAuthEnabled returns false for none', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: 'none' })).toBe(false);
  });

  it('isAuthDisabled is the inverse of isAuthEnabled', () => {
    expect(isAuthDisabled({ AUTH_PROVIDER: 'none' })).toBe(true);
    expect(isAuthDisabled({ AUTH_PROVIDER: 'oauth2' })).toBe(false);
  });
});

describe('exported constants', () => {
  it('OAUTH2_PROVIDER_ID is "oauth2"', () => {
    expect(OAUTH2_PROVIDER_ID).toBe('oauth2');
  });

  it('NONE_PROVIDER_ID is "none"', () => {
    expect(NONE_PROVIDER_ID).toBe('none');
  });

  it('AUTH_PROVIDER_IDS contains OAUTH2 and NONE only', () => {
    expect(Object.values(AUTH_PROVIDER_IDS)).toEqual(['oauth2', 'none']);
  });
});
