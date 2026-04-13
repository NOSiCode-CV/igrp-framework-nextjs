/**
 * Type definitions for environment variables.
 * Use validateEnv() for runtime validation; these types provide editor support.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production" | "test";

      // NextAuth
      AUTH_PROVIDER?: "keycloak" | "autentika";
      NEXTAUTH_SECRET?: string;
      NEXTAUTH_URL?: string;
      NEXTAUTH_URL_INTERNAL?: string;

      // Keycloak
      KEYCLOAK_CLIENT_ID?: string;
      KEYCLOAK_CLIENT_SECRET?: string;
      KEYCLOAK_ISSUER?: string;

      // Autentika
      AUTENTIKA_CLIENT_ID?: string;
      AUTENTIKA_CLIENT_SECRET?: string;
      AUTENTIKA_HOST?: string;
      AUTENTIKA_TENANT_NAME?: string;
      AUTENTIKA_SCOPES?: string;

      // IGRP
      IGRP_ACCESS_MANAGEMENT_API?: string;
      IGRP_APP_CODE?: string;
      IGRP_PREVIEW_MODE?: "true" | "false";
      IGRP_SYNC_ON_CODE_MENUS?: string;
      IGRP_SYNC_ACCESS?: string;
      IGRP_M2M_SERVICE_ID?: string;
      IGRP_M2M_TOKEN?: string;

      // Next.js public
      NEXT_IGRP_APP_CENTER_URL?: string;
      NEXT_PUBLIC_BASE_PATH?: string;
      NEXT_PUBLIC_IGRP_APP_HOME_SLUG?: string;
      NEXT_PUBLIC_ALLOWED_DOMAINS?: string;
      NEXT_PUBLIC_IGRP_PROFILE_URL?: string;
      NEXT_PUBLIC_IGRP_NOTIFICATION_URL?: string;
    }
  }
}

export {};
