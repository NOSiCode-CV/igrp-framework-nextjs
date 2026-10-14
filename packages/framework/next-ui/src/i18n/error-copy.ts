import type { IGRPChromeErrorCode, IGRPErrorCopy } from './strings.js';

export type IGRPErrorCopyResolver = (error: Error) => Partial<IGRPErrorCopy> | undefined | void;

/**
 * Title and description for an error screen.
 *
 * Order: the app's `custom` resolver (a partial result is merged over the
 * catalog, so returning only `{ description }` keeps the catalog title),
 * then the catalog entry for a known `IGRP_*` code carried on the error,
 * then the screen's generic pair.
 */
export function igrpResolveErrorCopy(
  error: Error,
  catalog: { byCode: Record<IGRPChromeErrorCode, IGRPErrorCopy>; fallback: IGRPErrorCopy },
  custom?: IGRPErrorCopyResolver,
): IGRPErrorCopy {
  const code = (error as { code?: unknown }).code;
  const byCode =
    typeof code === 'string' && Object.hasOwn(catalog.byCode, code)
      ? catalog.byCode[code as IGRPChromeErrorCode]
      : undefined;
  const base: IGRPErrorCopy = byCode ?? {
    title: catalog.fallback.title,
    description: catalog.fallback.description,
  };
  const override = custom?.(error);
  if (!override) return base;
  return {
    title: override.title ?? base.title,
    description: override.description ?? base.description,
  };
}
