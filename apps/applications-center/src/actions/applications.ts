'use server';

import { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { callApi } from '@/lib/api-client';
import { getIGRPAccessClient, mapperApplications, mapperCreateApplication } from '@igrp/framework-next';
import { CreateApplicationRequest } from '@igrp/platform-access-management-client-ts';

export async function getApplications() {
  try { 
    const client = await getIGRPAccessClient();
    const result = await client.applications.getApplications();
    const app = mapperApplications(result);
    return app;
  } catch (error) {
    console.error('[apps] Não foi possível obter os dados da aplicação:', error);
    throw error;
  }
}

export async function getApplicationByCode(appCode: string) {
  try {   
    const client = await getIGRPAccessClient();
    const result = await client.applications.getApplications({ code: appCode });
    const app = mapperApplications(result);
    return app[0];
  } catch (error) {
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    throw error;
  }
}

export async function createApplication(application: CreateApplicationRequest) {

  console.log({ application })
  try {   
    const client = await getIGRPAccessClient();
    const result = await client.applications.createApplication(application);
    const app = mapperCreateApplication(result);
    return app;
  } catch (error) {
    console.error('[app-by-code] Não foi possível criar à aplicação:', error);
    throw error;
  }
}

export async function getAppImage(appId: number) {
  return callApi<string>(`/apps/${appId}/getPicture`, {
    method: 'GET',
    isTextResponse: true,
  });
}

export async function updateApplication(id: number, updated: Partial<IGRPApplicationArgs>) {
  return callApi<IGRPApplicationArgs>(`/api/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updated),
  });
}

export async function deleteApplication(id: number) {
  return callApi<void>(`/api/applications/${id}`, {
    method: 'DELETE',
  });
}
