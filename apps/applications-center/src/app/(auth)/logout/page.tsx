'use client';

import { useEffect } from 'react';
import { signOut } from '@igrp/framework-next-auth/client';

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      let endSessionUrl = process.env.IGRP_LOGIN_URL || '/login';
      try {
        const res = await fetch('/api/auth/end-session-url', { cache: 'no-store' });
        const data = await res.json();
        if (typeof data?.url === 'string') endSessionUrl = data.url;
      } catch {}

      await signOut({ redirect: false });

      window.location.href = endSessionUrl;
    })();
  }, []);

  // TODO: apply design
  return <div>Logout in progress</div>;
}

// "use client";

// import { signOut } from "next-auth/react";

// export default function LogoutButton() {
//   const handleLogout = async () => {
//     // 1. Call the server-side API route to log out of Keycloak
//     const response = await fetch('/api/auth/logout-post', { method: 'POST' });

//     if (response.ok) {
//       // 2. Clear the local next-auth session
//       await signOut({ callbackUrl: '/' });
//     } else {
//       console.error("Server-side logout failed.");
//       // Fallback: clear the local session anyway
//       await signOut({ callbackUrl: '/' });
//     }
//   };

//   return <button onClick={handleLogout}>Logout</button>;
// }
