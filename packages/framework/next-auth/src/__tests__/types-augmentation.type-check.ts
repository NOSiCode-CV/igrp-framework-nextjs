/**
 * Type-level guard for the `next-auth` module augmentation in ../types.
 *
 * There is no runtime assertion possible here — this file exists to be
 * TYPE-CHECKED. It is what a consumer gets by adding `dist/types.d.ts` to
 * their tsconfig, so if the augmentation stops applying (or drifts from the
 * exported interfaces it is derived from), `tsc` fails here rather than in
 * someone's app.
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
} = {
  accessToken: s.accessToken,
  idToken: s.idToken,
  expiresAt: s.expiresAt,
  forceLogout: s.forceLogout,
  userId: s.user?.id,
  userName: s.user?.name,
};

export const _jwt: {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  idToken: string | undefined;
  expiresAt: number | undefined;
  forceLogout: boolean | undefined;
  userId: string | undefined;
  sub: string | undefined;
} = {
  accessToken: j.accessToken,
  refreshToken: j.refreshToken,
  idToken: j.idToken,
  expiresAt: j.expiresAt,
  forceLogout: j.forceLogout,
  userId: j.user?.id,
  sub: j.sub,
};
