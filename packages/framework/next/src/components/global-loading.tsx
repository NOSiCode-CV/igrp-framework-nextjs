import { fetchAppByCode } from '../hooks/use-applications.js';

/**
 * Placeholder app code used by the framework's own shell, which has no Access
 * Management record to look up.
 */
const FRAMEWORK_APP_CODE = 'IGRP';

/**
 * Loading placeholder that names the application it is loading.
 *
 * The name lookup is best-effort and deliberately swallowed. This renders as a
 * `loading.tsx` fallback, where throwing replaces the loading state with an
 * error boundary and a `redirect()` (which `fetchAppByCode` performs on a
 * 401/403) navigates the user away mid-suspense — both worse outcomes than
 * showing the raw code while the real page resolves.
 */
export async function IGRPGlobalLoading({ appCode }: { appCode: string }) {
  if (!appCode || appCode === FRAMEWORK_APP_CODE) {
    return <div>Loading...</div>;
  }

  let name = appCode;
  try {
    const app = await fetchAppByCode(appCode);
    name = app?.name ?? appCode;
  } catch {
    // Keep the code as the label — see above.
  }

  return <div>Loading {name}...</div>;
}
