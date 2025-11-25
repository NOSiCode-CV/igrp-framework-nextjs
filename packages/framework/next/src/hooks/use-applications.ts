import { igrpGetAccessClient } from '../lib/api-client';
import { mapperApplications } from '../mappers/applications-mapper';

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );

    const client = await igrpGetAccessClient();
    const result = await client.applications.getApplications({ code: appCode });
    const app = mapperApplications(result);
    return app[0];
  } catch (error) {
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    throw error;
  }
}

export async function fetchAppsByUser() {
  try {
    const client = await igrpGetAccessClient();
    const result = await client.users.getCurrentUserApplications();
    const apps = mapperApplications(result);
    return apps;
  } catch (error) {
    console.error('[apps-by-user] Erro ao carregar os dados da aplicação.:', error);
    throw error;
  }
}
