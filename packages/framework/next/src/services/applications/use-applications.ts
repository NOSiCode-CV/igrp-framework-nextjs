import { getAccessClient } from '../../lib/api-client';
import { mapperApplications } from './mapper';

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        'Preview Mode is not enabled, when not enabled, Applicattion code is required. Applications Code not found',
      );

    const client = await getAccessClient();
    const result = await client.applications.getApplications({ code: appCode });
    const app = mapperApplications(result);
    return app[0];
  } catch (error) {
    console.error('Failed to fetch application data:', error);
    throw error;
  }
}

export async function fetchAppsByUser(username: string) {
  try {
    if (!username) throw new Error('User not found');

    const client = await getAccessClient();
    const result = await client.applications.getApplicationsByUser(username);
    const apps = mapperApplications(result);
    return apps;
  } catch (error) {
    console.error('Failed to fetch application data:', error);
    throw error;
  }
}
