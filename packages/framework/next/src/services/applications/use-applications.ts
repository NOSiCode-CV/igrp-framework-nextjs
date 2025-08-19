import { getIGRPAccessClient } from '../../lib/api-client';
import { mapperApplications } from './mapper';

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está habilitado. Quando não habilitado, o código da aplicação é necessário. Código da Aplicação não encontrado.',
      );

    const client = await getIGRPAccessClient();
    const result = await client.applications.getApplications({ code: appCode });
    const app = mapperApplications(result);
    return app[0];
  } catch (error) {
    console.error('[app-by-code] Falha ao procurar dados da aplicação:', error);
    throw error;
  }
}

export async function fetchAppsByUser(username: string) {
  try {
    if (!username) throw new Error('[apps-by-user] Utilizador não encontrado');

    const client = await getIGRPAccessClient();
    const result = await client.applications.getApplicationsByUser(username);
    const apps = mapperApplications(result);
    return apps;
  } catch (error) {
    console.error('[apps-by-user] Falha ao procurar dados da aplicação:', error);
    throw error;
  }
}
