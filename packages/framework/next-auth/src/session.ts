import type { NextAuthOptions } from 'next-auth';

export type { NextAuthOptions };

export type AccessTokenSession = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  expires?: string;
  accessToken?: string;
};

export function hasAccessToken(s: unknown): s is AccessTokenSession {
  return !!(s && typeof s === 'object' && 'accessToken' in (s as any));
}