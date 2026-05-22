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

  const paramMap: Record<string, object> = {};
  const lineRegex = /"([^"]+)"\s*:\s*(\{[\s\S]*?});?/g;

  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(paramMapBody)) !== null) {
    const route = match[1];
    const paramObjText = match[2];

    if (route && paramObjText) {
      paramMap[route] = paramObjText.replace(/\s+/g, '') === '{}' ? {} : { params: true };
    }
  }

  // ---- Excluded routes ----
  const excludedRoutes = ['/login', '/logout', '/[...not-found]'];

  const menuRoutes = appRoutes.filter((route) => {
    const entry = paramMap[route];

    return entry && Object.keys(entry).length === 0 && !excludedRoutes.includes(route);
  });

  // ---- Sync to backend ----
  const resourceItems: ResourceItemDTO[] = menuRoutes.map((route): ResourceItemDTO => {
    return {
      name: serviceId + '-' + route.replace('/', '-'),
      url: route,
      resourceName: serviceId,
    };
  });

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
