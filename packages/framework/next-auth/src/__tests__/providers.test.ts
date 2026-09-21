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
  isOidcManagedProviderId,
  getAuthProviderDefinition,
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

  it('defaults to the real provider when AUTH_PROVIDER is not set', () => {
    // Was `none` — i.e. an app that never set the variable ran with auth OFF,
    // while the README documented `igrp-auth` as the default. Fail closed.
    expect(getAuthProviderIdFromEnv({})).toBe('igrp-auth');
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

  it('always includes openid even when omitted from IGRP_AUTH_SCOPES', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_SCOPES: 'profile email' };
    const provider = createAuthProviderFromEnv(env) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid profile email');
  });

  it('deduplicates openid when already present in IGRP_AUTH_SCOPES', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_SCOPES: 'openid openid profile' };
    const provider = createAuthProviderFromEnv(env) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid profile');
  });

  it('normalizes extra internal whitespace in IGRP_AUTH_SCOPES', () => {
    const env = { ...VALID_IGRP_AUTH_ENV, IGRP_AUTH_SCOPES: '  profile   email  ' };
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

  it('enables PKCE, state and nonce checks on the igrp-auth provider', () => {
    const provider = createAuthProviderFromEnv(VALID_IGRP_AUTH_ENV) as { checks: string[] };
    expect(provider.checks).toEqual(expect.arrayContaining(['pkce', 'state', 'nonce']));
  });

  it('includes pkce in the checks array (NextAuth applies S256 internally)', () => {
    const provider = createAuthProviderFromEnv(VALID_IGRP_AUTH_ENV) as { checks: string[] };
    expect(provider.checks).toContain('pkce');
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

  it('isAuthEnabled returns true when AUTH_PROVIDER is not set', () => {
    // Disabling auth is explicit-only now; an absent variable no longer does it.
    expect(isAuthEnabled({})).toBe(true);
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

describe('getAuthProviderIdFromEnv — empty AUTH_PROVIDER must never default', () => {
  // An earlier attempt at this treated `AUTH_PROVIDER=` as "unset" and let it
  // fall back. That is the wrong direction for THIS variable: the fallback
  // decides whether auth runs, so an empty assignment resolved to a provider,
  // `isAuthDisabled()` answered true, and a middleware following this package's
  // documented "use as the first check" pattern let every request through. A
  // typo must not be able to switch authentication off.
  it('refuses an empty or blank value instead of defaulting', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: '' })).toThrow(
      /AUTH_PROVIDER is set but empty/,
    );
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: '   ' })).toThrow(
      /AUTH_PROVIDER is set but empty/,
    );
  });

  it('refuses it even when an explicit fallback was passed', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: '' }, IGRP_AUTH_PROVIDER_ID)).toThrow(
      /AUTH_PROVIDER is set but empty/,
    );
  });

  it('fails CLOSED — auth stays enabled, it does not fall through to disabled', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: '' })).toBe(true);
    expect(isAuthDisabled({ AUTH_PROVIDER: '' })).toBe(false);
  });

  it('still rejects a genuinely unsupported value', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'okta' })).toThrow(
      /Unsupported AUTH_PROVIDER/,
    );
  });
});

describe('getAuthProviderIdFromEnv — absent AUTH_PROVIDER defaults closed', () => {
  // The default used to be `none`, so an app that never set the variable ran
  // with authentication disabled — while the README documented the opposite.
  it('resolves to the real provider, not the auth-disabled bypass', () => {
    expect(getAuthProviderIdFromEnv({})).toBe(IGRP_AUTH_PROVIDER_ID);
    expect(isAuthEnabled({})).toBe(true);
  });

  it('still lets a deployment disable auth, but only explicitly', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'none' })).toBe(NONE_PROVIDER_ID);
    expect(isAuthDisabled({ AUTH_PROVIDER: 'none' })).toBe(true);
  });
});

describe('isOidcManagedProviderId', () => {
  it('is true only for a real IGRP-registry provider', () => {
    expect(isOidcManagedProviderId(IGRP_AUTH_PROVIDER_ID)).toBe(true);
    expect(isOidcManagedProviderId(NONE_PROVIDER_ID)).toBe(false);
    expect(isOidcManagedProviderId('github')).toBe(false);
    expect(isOidcManagedProviderId(undefined)).toBe(false);
  });

  it('is not fooled by inherited Object properties', () => {
    expect(isOidcManagedProviderId('constructor')).toBe(false);
    expect(isOidcManagedProviderId('toString')).toBe(false);
  });
});

describe('getAuthProviderDefinition — unknown id', () => {
  it('throws a named error instead of a TypeError three frames later', () => {
    // It used to spread `undefined` into a half-built definition whose
    // requiredEnvKeys was missing; the failure surfaced as a bare
    // "Cannot read properties of undefined (reading 'filter')".
    expect(() => getAuthProviderDefinition({}, 'github' as never)).toThrow(
      /No IGRP auth provider definition for "github"/,
    );
  });
});
