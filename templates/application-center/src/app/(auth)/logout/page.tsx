'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

export default function LogoutPage() {
  useEffect(() => {
    Cookies.remove('userToken');
    signOut({ callbackUrl: '/login' });
  }, []);

  return null;
}
