// types/node-env.d.ts
declare namespace NodeJS {
  export interface ProcessEnv {
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    KEYCLOAK_ISSUER: string;
    BASE_URL_APP_MANAGER_API: string;
    BASE_URL_USER_MANAGER_API: string;
  }
}
