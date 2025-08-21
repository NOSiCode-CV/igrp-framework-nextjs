export { getServerSession } from 'next-auth';
export type { NextAuthOptions } from 'next-auth';

import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

export async function getServerSessionStrict(opts: NextAuthOptions) {
  const session = await getServerSession(opts);
  if (!session) throw new Error('Unauthorized');
  return session;
}
