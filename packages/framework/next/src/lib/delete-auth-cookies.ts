import { cookies } from 'next/headers';

export async function igrpDeleteAuthCookies(prodCookieName?: string, devCookieName?: string) {
  const store = await cookies();

  const DEV = devCookieName ? devCookieName : 'next-auth.session-token';
  const PROD = prodCookieName ? prodCookieName : '__Secure-next-auth.session-token';

  for (const c of store.getAll()) {
    if (c.name.includes(DEV) || c.name.includes(PROD)) {
      store.delete(c.name);
    }
  }
}
