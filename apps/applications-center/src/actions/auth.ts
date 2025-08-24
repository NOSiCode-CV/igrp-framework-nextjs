'use server';

import { getServerSession as getNextAuthServerSession } from '@igrp/framework-next-auth';
import { authOptions } from '@/lib/auth-options';
import { setIGRPAccessClientConfig } from '@igrp/framework-next';

export async function serverSession() {

  const apiManagement = process.env.IGRP_APP_MANAGER_API ?? '';

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

    if (session !== null) {
      setIGRPAccessClientConfig({
        token: session.accessToken || '',
        baseUrl: apiManagement,
      });
    }
    return session;
  } catch (error) {
    console.error('::Error getting server session::', error);
    return null;
  }
}
