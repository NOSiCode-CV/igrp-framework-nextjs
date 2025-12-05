import {
  AccessManagementClient,
  ApiClientConfig,
  M2MClientConfig,
  ResourceDTO,
  ResourceItemDTO,
  ResourceType,
} from '@igrp/platform-access-management-client-ts';

export interface IGRPSyncRoutesArgs {
  baseUrl: string;
  m2mServiceId: string;
  m2mToken: string;
  appRoutesContent?: string;
  appRoutesMatch?: string;
}

export async function igrpSyncRoutes({
  baseUrl,
  m2mServiceId,
  m2mToken,
  appRoutesContent,
  appRoutesMatch,
}: IGRPSyncRoutesArgs) {
  const config: ApiClientConfig = {
    baseUrl,
  };

  const m2mConfig: M2MClientConfig = {
    serviceId: m2mServiceId,
    token: m2mToken,
  };

  const accessManagementClient = AccessManagementClient.create(config, m2mConfig);

  if (!appRoutesContent) {
    throw new Error('Could not find AppRoutes in routes.d.ts');
  }

  const appRoutes = appRoutesContent
    .split('|')
    .map((r) => r.trim().replace(/"/g, ''))
    .filter((r) => r.length > 0 && !r.startsWith('type'));

  // ---- FIX 2: Extract ParamMap block ----
  const paramMapMatch = appRoutesMatch?.match(/interface ParamMap\s*{([\s\S]*?)^}/m) || [];

  if (!paramMapMatch || !paramMapMatch[1]) {
    throw new Error('Could not find ParamMap in routes.d.ts');
  }

  const paramMapBody = paramMapMatch[1];

  // ---- FIX 3: Parse ParamMap entries ----
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
  const excludedRoutes = ['/login', '/logout'];

  // ---- FIX 4: Filter static routes & exclude unwanted ----
  const menuRoutes = appRoutes.filter((route) => {
    const entry = paramMap[route];

    return (
      entry &&
      Object.keys(entry).length === 0 && // must be static
      !excludedRoutes.includes(route) // must not be excluded
    );
  });

  // ---- Sync to backend ----
  const resourceItems: ResourceItemDTO[] = menuRoutes.map((route): ResourceItemDTO => {
    return {
      name: m2mServiceId + '-' + route.replace('/', '-'),
      url: route,
      resourceName: m2mServiceId,
    };
  });

  const resource: ResourceDTO = {
    name: m2mServiceId,
    description: `User interface for service ${m2mServiceId}`,
    type: 'UI' as ResourceType,
    applications: [],
    items: resourceItems,
  };

  await accessManagementClient.m2m.syncResources(resource);

  console.log('✔ Synced static menu routes:', menuRoutes);
}
