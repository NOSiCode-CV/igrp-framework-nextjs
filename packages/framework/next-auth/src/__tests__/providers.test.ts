import { describe, it, expect } from 'vitest';
import {
  getAuthProviderIdFromEnv,
  assertAuthProviderEnv,
  getMissingAuthProviderEnvVars,
  getAuthProviderDiscoveryUrl,
  createAuthProviderFromEnv,
  isAuthEnabled,
  isAuthDisabled,
  IGRP_AUTH_PROVIDER_ID,
  NONE_PROVIDER_ID,
  AUTH_PROVIDER_IDS,
} from '../providers';

const VALID_IGRP_AUTH_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'igrp-example',
  IGRP_AUTH_CLIENT_SECRET: 'psw',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
};

describe('getAuthProviderIdFromEnv', () => {
  it('returns igrp-auth when AUTH_PROVIDER=igrp-auth', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'igrp-auth' })).toBe('igrp-auth');
  });

  it('defaults to none when AUTH_PROVIDER is not set', () => {
    expect(getAuthProviderIdFromEnv({})).toBe('none');
  });

  it('returns none when AUTH_PROVIDER=none', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'none' })).toBe('none');
  });

  it('is case-insensitive', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'IGRP-AUTH' })).toBe('igrp-auth');
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

  it('throws for oauth2 (renamed provider)', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'oauth2' })).toThrow(
      'Unsupported AUTH_PROVIDER "oauth2"',
    );
  });
});

describe('getMissingAuthProviderEnvVars', () => {
  it('returns missing keys for igrp-auth when env is empty', () => {
    const missing = getMissingAuthProviderEnvVars({}, 'igrp-auth');
    expect(missing).toEqual(['IGRP_AUTH_CLIENT_ID', 'IGRP_AUTH_CLIENT_SECRET', 'IGRP_AUTH_ISSUER']);
  });

  it('returns empty array when all igrp-auth vars are present', () => {
    const missing = getMissingAuthProviderEnvVars(VALID_IGRP_AUTH_ENV, 'igrp-auth');
    expect(missing).toEqual([]);
  });

  it('returns empty array for none provider (no required vars)', () => {
    const missing = getMissingAuthProviderEnvVars({}, 'none');
    expect(missing).toEqual([]);
  });
});

describe('assertAuthProviderEnv', () => {
  it('does not throw when all igrp-auth vars are present', () => {
    expect(() => assertAuthProviderEnv(VALID_IGRP_AUTH_ENV)).not.toThrow();
  });

  it('throws when IGRP_AUTH_CLIENT_ID is missing', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_CLIENT_ID: undefined };
    expect(() => assertAuthProviderEnv(env)).toThrow('IGRP_AUTH_CLIENT_ID');
  });

  it('throws when IGRP_AUTH_CLIENT_SECRET is missing', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_CLIENT_SECRET: '' };
    expect(() => assertAuthProviderEnv(env)).toThrow('IGRP_AUTH_CLIENT_SECRET');
  });

  it('throws when IGRP_AUTH_ISSUER is missing', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_ISSUER: undefined };
    expect(() => assertAuthProviderEnv(env)).toThrow('IGRP_AUTH_ISSUER');
  });

  it('does not throw for none provider regardless of env', () => {
    expect(() => assertAuthProviderEnv({ AUTH_PROVIDER: 'none' })).not.toThrow();
  });
});

describe('getAuthProviderDiscoveryUrl', () => {
  it('appends /.well-known/openid-configuration to IGRP_AUTH_ISSUER', () => {
    const url = getAuthProviderDiscoveryUrl(VALID_IGRP_AUTH_ENV);
    expect(url).toBe('http://localhost:9090/.well-known/openid-configuration');
  });

  it('strips trailing slash from IGRP_AUTH_ISSUER before appending', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_ISSUER: 'http://localhost:9090/' };
    expect(getAuthProviderDiscoveryUrl(env)).toBe(
      'http://localhost:9090/.well-known/openid-configuration',
    );
  });

  it('returns empty string for none provider', () => {
    expect(getAuthProviderDiscoveryUrl({ AUTH_PROVIDER: 'none' })).toBe('');
  });
});

describe('createAuthProviderFromEnv', () => {
  it('returns an OAuthConfig with correct id for igrp-auth', () => {
    const provider = createAuthProviderFromEnv(VALID_IGRP_AUTH_ENV);
    expect(provider).not.toBeNull();
    expect((provider as { id: string }).id).toBe('igrp-auth');
  });

  it('sets wellKnown from IGRP_AUTH_ISSUER', () => {
    const provider = createAuthProviderFromEnv(VALID_IGRP_AUTH_ENV) as { wellKnown: string };
    expect(provider.wellKnown).toBe('http://localhost:9090/.well-known/openid-configuration');
  });

  it('sets default scope to openid when IGRP_AUTH_SCOPES is not set', () => {
    const provider = createAuthProviderFromEnv(VALID_IGRP_AUTH_ENV) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid');
  });

  it('uses IGRP_AUTH_SCOPES when provided', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_SCOPES: 'openid profile email' };
    const provider = createAuthProviderFromEnv(env) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid profile email');
  });

  it('returns null for none provider', () => {
    expect(createAuthProviderFromEnv({ AUTH_PROVIDER: 'none' })).toBeNull();
  });

  it('wires clientId and clientSecret from env into the provider', () => {
    const provider = createAuthProviderFromEnv(VALID_IGRP_AUTH_ENV) as {
      clientId: string;
      clientSecret: string;
    };
    expect(provider.clientId).toBe('igrp-example');
    expect(provider.clientSecret).toBe('psw');
  });
});

describe('isAuthEnabled / isAuthDisabled', () => {
  it('isAuthEnabled returns true for igrp-auth', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: 'igrp-auth' })).toBe(true);
  });

  it('isAuthEnabled returns false for none', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: 'none' })).toBe(false);
  });

  it('isAuthDisabled is the inverse of isAuthEnabled', () => {
    expect(isAuthDisabled({ AUTH_PROVIDER: 'none' })).toBe(true);
    expect(isAuthDisabled({ AUTH_PROVIDER: 'igrp-auth' })).toBe(false);
  });

  it('isAuthEnabled returns false when AUTH_PROVIDER is not set', () => {
    expect(isAuthEnabled({})).toBe(false);
  });
});

describe('exported constants', () => {
  it('IGRP_AUTH_PROVIDER_ID is "igrp-auth"', () => {
    expect(IGRP_AUTH_PROVIDER_ID).toBe('igrp-auth');
  });

  it('NONE_PROVIDER_ID is "none"', () => {
    expect(NONE_PROVIDER_ID).toBe('none');
  });

  it('AUTH_PROVIDER_IDS contains IGRP_AUTH and NONE only', () => {
    expect(Object.values(AUTH_PROVIDER_IDS)).toEqual(['igrp-auth', 'none']);
  });
});
