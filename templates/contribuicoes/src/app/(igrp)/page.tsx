import { redirect } from 'next/navigation';

export default function Home() {
  // return <div className="text-3xl font-bold">
  //   IGRP NEXT.js Template this is demo contribuições
  // </div>;
  const root = process.env.IGRP_APP_HOME_SLUG ?? process.env.IGRP_APP_BASE_PATH ?? '/';
  if (!root.startsWith('/')) throw new Error('Root redirect must be a valid path');
  redirect(root);
}
