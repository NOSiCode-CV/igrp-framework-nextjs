import { igrpGetAccessClient } from '../lib/api-client';

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );

    const client = await igrpGetAccessClient();
    const result = await client.applications.getApplications({ code: appCode });
    const app = result.data;
    return app?.[0];
  } catch (error) {
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    throw error;
  }
}

export async function fetchAppsByUser(username: string) {
  try {
    if (!username) throw new Error('[apps-by-user] O utilizador não foi encontrado.');

    const client = await igrpGetAccessClient();
    const result = await client.applications.getApplicationsByUser(username);
    const apps = result.data;
    return apps ?? [];
  } catch (error) {
    console.error('[apps-by-user] Erro ao carregar os dados da aplicação.:', error);
    throw error;
  }
}
