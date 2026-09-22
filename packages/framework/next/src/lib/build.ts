import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { z } from 'zod';

import { IgrpConfigError, type IgrpErrorCode } from '../errors.js';

const isFunction = (v: unknown): boolean => typeof v === 'function';
const isBlank = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

/**
 * Runtime schema for {@link IGRPConfigArgs}. Deliberately LOOSER than the
 * declared type at the field level (env-sourced values can be undefined at
 * runtime) — the conditional invariants live in `superRefine`, mirroring the
 * gates in `planAccessManagementSync` so a config that boots also syncs:
 *
 *   • `previewMode` / `syncAccess` must be real booleans.
 *   • exactly one of `layoutData` / `layoutMockData` (deprecated) is set,
 *     and its `getHeaderData` / `getSidebarData` are functions.
 *   • `layout` must be present — `IGRPRootLayout` destructures it on the first
 *     line of its render, so a missing one is a bare `TypeError` in the root
 *     layout with no framework error code attached.
 *   • `syncAccess && !previewMode` ⇒ `appInformation.name` must be a non-blank
 *     string. `igrpSyncApplication` dereferences it inside `after()`, which is
 *     post-stream: a `TypeError` there reaches a server log and nothing else.
 *     That is precisely the blind spot this synchronous validation exists to
 *     keep config errors out of.
 *   • `!previewMode` ⇒ `apiManagementConfig.baseUrl` is required.
 *   • `syncAccess && !previewMode` ⇒ `serviceId`, `m2mClientId`,
 *     `m2mClientSecret` and `appCode` must be non-blank.
 *
 * Unknown keys pass through untouched — the schema validates, it never
 * replaces the config object.
 */
const layoutDataSourceSchema = (field: string) =>
  z.object({
    getHeaderData: z.custom<() => Promise<unknown>>(isFunction, {
      message: `${field}.getHeaderData deve ser uma função assíncrona.`,
    }),
    getSidebarData: z.custom<() => Promise<unknown>>(isFunction, {
      message: `${field}.getSidebarData deve ser uma função assíncrona.`,
    }),
  });

const igrpConfigSchema = z
  .object({
    appCode: z.string().optional(),
    previewMode: z.boolean(),
    syncAccess: z.boolean(),
    // Required by `IGRPConfigArgs`, and read unconditionally by
    // `IGRPRootLayout`. Kept structurally loose (`session` may legitimately be
    // null, the rest are optional) — the point is that the object exists.
    layout: z.object({}).catchall(z.unknown()),
    appInformation: z.object({ name: z.string().optional() }).catchall(z.unknown()).optional(),
    // `layoutData` supersedes `layoutMockData`; both are optional at the field
    // level and the "exactly one" rule lives in `superRefine` below, so the
    // error names the conflict rather than a missing key.
    layoutData: layoutDataSourceSchema('layoutData').optional(),
    layoutMockData: layoutDataSourceSchema('layoutMockData').optional(),
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
    if (!cfg.layoutData && !cfg.layoutMockData) {
      ctx.addIssue({
        code: 'custom',
        path: ['layoutData'],
        message:
          'É necessária a fonte de dados do layout: defina `layoutData` (ou o descontinuado `layoutMockData`).',
      });
    }
    if (cfg.layoutData && cfg.layoutMockData) {
      ctx.addIssue({
        code: 'custom',
        path: ['layoutData'],
        message: 'Defina `layoutData` OU `layoutMockData` (descontinuado), não ambos.',
      });
    }
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
      // `igrpSyncApplication` reads `appInformation.displayName ?? .name` and
      // `.description` / `.slug` inside `after()`. Validate it here, where the
      // failure can still reach `global-error.tsx`.
      if (isBlank(cfg.appInformation?.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['appInformation', 'name'],
          message:
            'IGRP_SYNC_ACCESS=true requer appInformation.name não-vazio (package.json da aplicação).',
        });
      }
    }
  });

/** Maps a Zod issue path to the stable IgrpError code consumers switch on. */
function codeForIssuePath(path: ReadonlyArray<PropertyKey>): IgrpErrorCode {
  if (path[0] === 'appCode') return 'IGRP_APP_CODE_MISSING';
  if (path[0] === 'apiManagementConfig') return 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING';
  // `appInformation` / `layout` are structural — they have no dedicated code,
  // and inventing one would widen `IgrpErrorCode` for no consumer.
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

  // Canonicalize the app code once, at the single point every consumer flows
  // through. Uppercase is the canonical form on the Access Management server;
  // the AM sync (`planAccessManagementSync`) normalizes defensively too, but
  // the read paths — menu/app fetch hooks and their cache keys — use
  // `config.appCode` directly, so a lowercase env value must not survive past
  // here or sync would register `APP_X` while reads query `app_x`.
  if (typeof config.appCode === 'string') {
    const appCode = config.appCode.trim().toUpperCase();
    if (appCode !== config.appCode) {
      return { ...config, appCode };
    }
  }

  return config;
}
