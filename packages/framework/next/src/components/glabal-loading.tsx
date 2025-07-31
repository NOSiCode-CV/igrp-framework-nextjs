import { fetchAppByCode } from '../services/applications/use-applications';

export async function IGRPGlobalLoading({ appCode }: { appCode: string }) {
  if (!appCode || appCode === 'IGRP') {
    return (
      <>
        <div>Loading...</div>
        <span className='hidden'>{appCode}</span>
      </>
    );
  }

  const app = await fetchAppByCode(appCode);

  if (!app) {
    return <div>Loading...</div>;
  }

  return <div>Loading...</div>;
}
