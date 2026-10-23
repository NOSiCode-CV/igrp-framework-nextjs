import 'server-only';

import { cache } from 'react';

import { igrpThrowOnAccessAuthError } from '../lib/access-auth-error.js';
import { igrpGetAccessClient } from '../lib/api-client.js';
import { mapperApplications } from '../mappers/applications-mapper.js';
import { logger } from '../logger.js';

const getCachedAppsByUser = cache(async function fetchAppsByUserOnce() {
  const client = igrpGetAccessClient();
  const result = await client.users.getCurrentUserApplications();
  return mapperApplications(result);
});

const getCachedAppByCode = cache(async function fetchAppByCodeOnce(appCode: string) {
  const client = igrpGetAccessClient();
  const result = await client.applications.getApplications({ code: appCode });
  const apps = mapperApplications(result);
  return apps.find((a) => a.code === appCode) ?? null;
});

export async function fetchAppsByUser() {
  try {
    return await getCachedAppsByUser();
  } catch (error) {
    await igrpThrowOnAccessAuthError(error);
    // Non-auth failure (timeout / network / 5xx): surface it so the layout's
    // error boundary engages instead of rendering an empty list that looks like
    // a zero-permission user. The action layer (actions/index.ts) catches this
    // into ActionResult; SidebarDataProvider propagates to its boundary.
    logger.error('[apps-by-user] Erro ao carregar os dados da aplicação.', error);
    throw error;
  }
}

export async function fetchAppByCode(appCode: string) {
  // Local validation: throw directly to the caller. Keeping this outside the
  // try avoids mislabeling a missing-appCode bug as a generic AM-fetch failure
  // and re-logging it under '[app-by-code] Não foi possível obter...'.
  if (!appCode)
    throw new Error(
      '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
    );
  try {
    return await getCachedAppByCode(appCode);
  } catch (error) {
    await igrpThrowOnAccessAuthError(error);
    // Non-auth failure (timeout / network / 5xx): surface it so the layout's
    // error boundary engages instead of rendering a null app that silently
    // breaks the layout. The action layer (actions/index.ts) catches this
    // into ActionResult; SidebarDataProvider propagates to its boundary.
    logger.error('[app-by-code] Não foi possível obter os dados da aplicação.', error);
    throw error;
  }
}
