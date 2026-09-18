import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
import type { ApiResponse, ApplicationDTO } from '@igrp/platform-access-management-client-ts';

const mapApplication = (app: ApplicationDTO): IGRPApplicationArgs => ({
  id: app.id,
  code: app.code,
  name: app.name,
  description: app.description,
  status: app.status,
  type: app.type,
  owner: app.owner || undefined,
  picture: app.picture,
  url: app.url || undefined,
  slug: app.slug || undefined,
  departments: app.departments,
  createdBy: app.createdBy || undefined,
  createdDate: app.createdDate || undefined,
  lastModifiedBy: app.lastModifiedBy || undefined,
  lastModifiedDate: app.lastModifiedDate || undefined,
  lastAccess: app.lastAccess || undefined,
});

export const mapperApplications = (apps: ApiResponse<ApplicationDTO[]>): IGRPApplicationArgs[] => {
  if (!apps.data) return [];
  return apps.data.map(mapApplication);
};
