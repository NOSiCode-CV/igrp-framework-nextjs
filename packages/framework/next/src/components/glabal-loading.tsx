import { fetchAppByCode } from '../hooks/use-applications';

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
