import type { IGRPConfigArgs } from '@igrp/framework-next-types';

/**
 * The single place that decides which credential reads the Brand. Today it is
 * the signed-in user's access token. Switching to an M2M provider later changes
 * only this function (see the ADR in the framework `docs/adr`).
 */
export function resolveBrandingToken(config: IGRPConfigArgs): string | undefined {
  const session = config.layout.session as { accessToken?: unknown } | null | undefined;
  return typeof session?.accessToken === 'string' ? session.accessToken : undefined;
}
