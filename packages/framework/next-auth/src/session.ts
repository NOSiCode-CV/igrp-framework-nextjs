import type { NextAuthOptions, TokenSet } from 'next-auth';
import type { Session as DefaultSession } from 'next-auth';

export type { NextAuthOptions, TokenSet };

export interface Session extends DefaultSession {
  accessToken?: string;
  idToken?: string;
  expiresAt?: number;
  error?: string;
  user?: {
    id?: string;
  } & DefaultSession['user'];
}

export function hasAccessToken(s: unknown): s is Session {
  return !!(s && typeof s === 'object' && 'accessToken' in (s as any));
}