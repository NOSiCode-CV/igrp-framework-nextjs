'use server';

import { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { callApi } from '@/lib/api-client';

export async function getApplications() {
  return callApi<IGRPApplicationArgs[]>('/api/applications');
}

export async function getApplicationById(id: number) {
  return callApi<IGRPApplicationArgs>(`/api/applications/${id}`);
}

export async function getAppImage(appId: number) {
  return callApi<string>(`/apps/${appId}/getPicture`, {
    method: 'GET',
    isTextResponse: true,
  });
}

export async function createApplication(application: Omit<IGRPApplicationArgs, 'id' | 'creationDate'>) {
  return callApi<IGRPApplicationArgs>('/api/applications', {
    method: 'POST',
    body: JSON.stringify(application),
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
