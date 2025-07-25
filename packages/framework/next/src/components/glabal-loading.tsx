import { fetchAppByCode } from '../services/applications/use-applications';

export async function IGRPGlobalLoading({ appCode }: { appCode: string }) {
  if (!appCode || appCode === 'IGRP') {
    console.log({ appCode });
    return <div>Loading...</div>;
  }

  const app = await fetchAppByCode(appCode);

  if (!app) {
    return <div>Loading...</div>;
  }

  return <div>Loading...</div>;
}
