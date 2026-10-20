import 'server-only';

import {
  type AccessManagementClient,
  type ResourceDTO,
  type ResourceItemDTO,
  type ResourceType,
} from '@igrp/platform-access-management-client-ts';

export interface IGRPSyncRoutesArgs {
  client: AccessManagementClient;
  serviceId: string;
  appRoutes?: string[];
  paramMapBody?: string;
}

/** Routes that exist for the auth/error chrome and are never navigable resources. */
const EXCLUDED_ROUTES = ['/login', '/logout', '/[...not-found]'];

/**
 * Extract `"route": { … }` pairs from the generated route-params source text.
 *
 * Brace-counted rather than regex-matched. The previous
 * `/"([^"]+)"\s*:\s*(\{[\s\S]*?});?/g` stopped at the FIRST `}`, so a nested
 * object truncated the match: `"/a": { "nested": { } }` parsed as
 * `{ "nested": {` — the route was then judged "has params" and silently
 * dropped from the sync. It survived only because the upstream generator
 * happens to emit flat objects today.
 *
 * Returns each route mapped to whether its param object is empty, which is the
 * only thing the caller actually asks.
 */
export function parseRouteParamMap(paramMapBody: string): Map<string, boolean> {
  const result = new Map<string, boolean>();
  const keyPattern = /"([^"]+)"\s*:\s*\{/g;

  let match: RegExpExecArray | null;
  while ((match = keyPattern.exec(paramMapBody)) !== null) {
    const route = match[1];
    if (!route) continue;

    // `keyPattern.lastIndex` sits just past the opening brace.
    //
    // String literals are skipped rather than counted through: a brace inside
    // one (`{ x: "}" }`) closed the object early, and the truncated body then
    // read as "has params", silently dropping a parameterless route from the
    // sync. Quotes are tracked with escape handling so `"\""` does not end the
    // string either.
    let depth = 1;
    let quote: string | null = null;
    let i = keyPattern.lastIndex;
    for (; i < paramMapBody.length && depth > 0; i++) {
      const ch = paramMapBody[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    // Unbalanced input: stop rather than record a half-read object. Loud,
    // because every route after this point is dropped from the sync and the
    // only symptom is a resource list that is quietly short.
    if (depth !== 0) {
      console.warn(
        `[igrp] route param map is unbalanced from "${route}" onwards — ` +
          `${result.size} route(s) parsed, the rest were skipped.`,
      );
      break;
    }

    const body = paramMapBody.slice(keyPattern.lastIndex, i - 1);
    result.set(route, body.trim() === '');
    // Resume scanning after the object we just consumed, so a nested key can
    // never be mistaken for a top-level route.
    keyPattern.lastIndex = i;
  }

  return result;
}

/**
 * Resource-item name for a route.
 *
 * `route.replace('/', '-')` replaced only the FIRST slash, so `/admin/users`
 * became `-admin/users` and the item shipped as `svc--admin/users` — a double
 * separator and an embedded slash in a name AM treats as an identifier. Every
 * segment separator is replaced, and the leading one is dropped rather than
 * doubled.
 */
export function routeResourceName(serviceId: string, route: string): string {
  const slug = route.replace(/^\/+/, '').replaceAll('/', '-');
  return slug ? `${serviceId}-${slug}` : serviceId;
}

export async function igrpSyncRoutes({
  client,
  serviceId,
  appRoutes,
  paramMapBody,
}: IGRPSyncRoutesArgs) {
  if (!appRoutes || !paramMapBody) {
    console.warn('No app routes or param map body found');
    return;
  }

  const paramMap = parseRouteParamMap(paramMapBody);

  // Only parameterless routes become resources: a dynamic segment has no
  // single URL to register.
  const menuRoutes = appRoutes.filter(
    (route) => paramMap.get(route) === true && !EXCLUDED_ROUTES.includes(route),
  );

  const resourceItems: ResourceItemDTO[] = menuRoutes.map((route): ResourceItemDTO => ({
    name: routeResourceName(serviceId, route),
    url: route,
    resourceName: serviceId,
  }));

  const resource: ResourceDTO = {
    name: serviceId,
    description: `User interface for service ${serviceId}`,
    type: 'UI' as ResourceType,
    applications: [],
    items: resourceItems,
  };

  await client.m2m.syncResources(resource);

  console.info('Synced static menu routes:', menuRoutes);
}
