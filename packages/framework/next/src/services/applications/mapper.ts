import type { IGRPApplicationArgs, IGRPItemStatus } from '@igrp/framework-next-types';
import type { ApiResponse, ApplicationDTO } from '@igrp/platform-access-management-client-ts';

const mapApplication = (app: ApplicationDTO): IGRPApplicationArgs => ({
  id: app.id as number,
  code: app.code,
  name: app.name,
  description: app.description,
  status: app.status as IGRPItemStatus,
  type: app.type,
  owner: app.owner || undefined,
  picture: app.picture,
  url: app.url || null,
  slug: app.slug || undefined,
});

export const mapperApplications = (apps: ApiResponse<ApplicationDTO[]>): IGRPApplicationArgs[] => {
  if (!apps.data) return [];
  return apps.data.map(mapApplication);
};
