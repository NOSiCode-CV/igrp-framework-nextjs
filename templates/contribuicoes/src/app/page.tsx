import { redirect } from 'next/navigation';

export default function Home() {
  const root = process.env.IGRP_APP_HOME_SLUG ?? process.env.IGRP_APP_HOME_SLUG ?? '/';
  if (!root.startsWith('/')) throw new Error('Root redirect must be a valid path');
  if (root === '/') {
    return <div className="text-3xl font-bold">IGRP NEXT.js Template</div>;
  }
  redirect(root);
}
