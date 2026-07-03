import { fetchAppByCode } from '../hooks/use-applications';

export async function IGRPGlobalLoading({ appCode }: { appCode: string }) {
  if (!appCode || appCode === 'IGRP') {
    return <div>Loading...</div>;
  }

  const app = await fetchAppByCode(appCode);

  return <div>Loading {app?.name ?? appCode}...</div>;
}
