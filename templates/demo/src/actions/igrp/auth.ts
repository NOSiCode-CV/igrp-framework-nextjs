'use server';

import { getServerSession as getNextAuthServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { ExtendedSession } from '@igrp/framework-next-types';

export async function serverSession() {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn('Warning: NEXTAUTH_SECRET is not set. This is required for production.');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('NEXTAUTH_SECRET must be set in production');
      }
    }

    if (
      !process.env.KEYCLOAK_CLIENT_ID ||
      !process.env.KEYCLOAK_CLIENT_SECRET ||
      !process.env.KEYCLOAK_ISSUER
    ) {
      console.warn('Warning: One or more Keycloak environment variables are missing.');
      throw new Error('One or more Keycloak environment variables are missing.');
    }

    const session = await getNextAuthServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('::Error getting server session::', error);
    return null;
  }
}

export async function getSession() {
  let session: ExtendedSession | null;
  const isPreviewMode = process.env.IGRP_PREVIEW_MODE === 'true';

  console.log({ isPreviewMode })

  if (isPreviewMode) return (session = null);

  if (process.env.NODE_ENV === 'production') {
    try {
      session = await serverSession();
    } catch (error) {
      console.error('Failed to get session in layout:', error);
      session = null;
    }
  } else {
    session = null;
  }

  console.log({ session })

  return session;
}