import { NextResponse } from 'next/server';

// ::: REDIRECT localhost:3000/ -> localhost:3000/IGRP_APP_BASE_PATH :::

// export default async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   console.log({ pathname });

//   return NextResponse.next();
// }

export default async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', 
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
};