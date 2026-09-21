/**
 * Type-level guard for the `next-auth` module augmentation in ../types.
 *
 * There is no runtime assertion possible here — this file exists to be
 * TYPE-CHECKED. It is what a consumer gets by adding `dist/types.d.ts` to
 * their tsconfig, so if the augmentation stops applying (or drifts from the
 * exported interfaces it is derived from), `tsc` fails here rather than in
 * someone's app.
 *
 * `tsc -p tsconfig.json` is the only thing that runs this file — vitest's
 * include matches `.test.ts` only, and this is not a tsup dts entry either.
 * That is why `typecheck` is wired into the package's `release` script: without
 * it, the one guard against augmentation drift never ran anywhere.
 */
import '../types';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare const s: Session;
declare const j: JWT;

export const _session: {
  accessToken: string | undefined;
  idToken: string | undefined;
  expiresAt: number | undefined;
  forceLogout: boolean | undefined;
  userId: string | undefined;
  userName: string | null | undefined;
  // Widened to accept a custom provider's own id — `withIGRPAuth` stamps
  // whatever the resolved provider calls itself, not just the registry ids.
  authProviderId: string | undefined;
} = {
  accessToken: s.accessToken,
  idToken: s.idToken,
  expiresAt: s.expiresAt,
  forceLogout: s.forceLogout,
  userId: s.user?.id,
  userName: s.user?.name,
  authProviderId: s.authProviderId,
};

export const _jwt: {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  idToken: string | undefined;
  expiresAt: number | undefined;
  forceLogout: boolean | undefined;
  userId: string | undefined;
  sub: string | undefined;
  authProviderId: string | undefined;
} = {
  accessToken: j.accessToken,
  refreshToken: j.refreshToken,
  idToken: j.idToken,
  expiresAt: j.expiresAt,
  forceLogout: j.forceLogout,
  userId: j.user?.id,
  sub: j.sub,
  authProviderId: j.authProviderId,
};
