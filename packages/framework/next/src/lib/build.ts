import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { z } from 'zod';

import { IgrpConfigError, type IgrpErrorCode } from '../errors';

const isFunction = (v: unknown): boolean => typeof v === 'function';
const isBlank = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

/**
 * Runtime schema for {@link IGRPConfigArgs}. Deliberately LOOSER than the
 * declared type at the field level (env-sourced values can be undefined at
 * runtime) — the conditional invariants live in `superRefine`, mirroring the
 * gates in `planAccessManagementSync` so a config that boots also syncs:
 *
 *   • `previewMode` / `syncAccess` must be real booleans.
 *   • `layoutMockData.getHeaderData/getSidebarData` must be functions.
 *   • `!previewMode` ⇒ `apiManagementConfig.baseUrl` is required.
 *   • `syncAccess && !previewMode` ⇒ `serviceId`, `m2mClientId`,
 *     `m2mClientSecret` and `appCode` must be non-blank.
 *
 * Unknown keys pass through untouched — the schema validates, it never
 * replaces the config object.
 */
const igrpConfigSchema = z
  .object({
    appCode: z.string().optional(),
    previewMode: z.boolean(),
    syncAccess: z.boolean(),
    layoutMockData: z.object({
      getHeaderData: z.custom<() => Promise<unknown>>(isFunction, {
        message: 'layoutMockData.getHeaderData deve ser uma função assíncrona.',
      }),
      getSidebarData: z.custom<() => Promise<unknown>>(isFunction, {
        message: 'layoutMockData.getSidebarData deve ser uma função assíncrona.',
      }),
    }),
    toasterConfig: z.object({ showToaster: z.boolean() }).catchall(z.unknown()),
    apiManagementConfig: z
      .object({
        baseUrl: z.string().optional(),
        serviceId: z.string().optional(),
        m2mClientId: z.string().optional(),
        m2mClientSecret: z.string().optional(),
      })
      .catchall(z.unknown())
      .optional(),
  })
  .catchall(z.unknown())
  .superRefine((cfg, ctx) => {
    if (!cfg.previewMode && isBlank(cfg.apiManagementConfig?.baseUrl)) {
      ctx.addIssue({
        code: 'custom',
        path: ['apiManagementConfig', 'baseUrl'],
        message:
          'Modo de pré-visualização desativado. É necessária a configuração da gestão de acesso (baseUrl).',
      });
    }
    if (cfg.syncAccess && !cfg.previewMode) {
      for (const field of ['serviceId', 'm2mClientId', 'm2mClientSecret'] as const) {
        if (isBlank(cfg.apiManagementConfig?.[field])) {
          ctx.addIssue({
            code: 'custom',
            path: ['apiManagementConfig', field],
            message: `IGRP_SYNC_ACCESS=true requer apiManagementConfig.${field} não-vazio.`,
          });
        }
      }
      if (isBlank(cfg.appCode)) {
        ctx.addIssue({
          code: 'custom',
          path: ['appCode'],
          message: 'IGRP_SYNC_ACCESS=true requer um appCode não-vazio (IGRP_APP_CODE).',
        });
      }
    }
  });

/** Maps a Zod issue path to the stable IgrpError code consumers switch on. */
function codeForIssuePath(path: ReadonlyArray<PropertyKey>): IgrpErrorCode {
  if (path[0] === 'appCode') return 'IGRP_APP_CODE_MISSING';
  if (path[0] === 'apiManagementConfig') return 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING';
  return 'IGRP_CONFIG_INVALID';
}

/**
 * Validates an assembled IGRP config. Invoked from {@link igrpBuildConfig}.
 *
 * Runs at the template's **root segment** (the template calls `createConfig`
 * from its root `app/layout.tsx` / `src/igrp.template.config.ts`), so any
 * `IgrpConfigError` thrown here bubbles to `app/global-error.tsx` — the only
 * boundary that can render when the root layout itself fails. See the
 * framework CLAUDE.md for the full error-handling contract.
 *
 * Throws `IgrpConfigError` with a stable `code`:
 *   • `IGRP_CONFIG_NOT_INITIALIZED` — `config` is null / undefined.
 *   • `IGRP_CONFIG_INVALID` — structural problem (wrong types, missing
 *     mock-data functions, non-boolean flags).
 *   • `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING` — preview mode is off / sync is
 *     on and the access-management configuration is incomplete.
 *   • `IGRP_APP_CODE_MISSING` — sync is on but `appCode` is blank.
 */
function validateConfig(
  config: IGRPConfigArgs | null | undefined,
): asserts config is IGRPConfigArgs {
  if (!config) {
    throw new IgrpConfigError(
      'IGRP_CONFIG_NOT_INITIALIZED',
      '[igrp-template-config]: A configuração do IGRP não foi inicializada.',
    );
  }

  const result = igrpConfigSchema.safeParse(config);
  if (!result.success) {
    const first = result.error.issues[0]!;
    const field = first.path.join('.');
    throw new IgrpConfigError(
      codeForIssuePath(first.path),
      `[igrp-template-config]: Configuração inválida em "${field}": ${first.message}`,
      { field, issueCount: result.error.issues.length },
    );
  }
}

export async function igrpBuildConfig(config: IGRPConfigArgs): Promise<IGRPConfigArgs> {
  validateConfig(config);
  return config;
}
