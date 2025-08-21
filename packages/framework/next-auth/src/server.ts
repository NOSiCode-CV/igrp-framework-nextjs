import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export async function getServerSessionStrict(opts: NextAuthOptions) {
  const session = await getServerSession(opts);
  if (!session) throw new Error('Unauthorized');
  return session;
}

export { getServerSession } from 'next-auth';
export type { NextAuthOptions } from 'next-auth';
export { NextAuth } 
export { KeycloakProvider }
