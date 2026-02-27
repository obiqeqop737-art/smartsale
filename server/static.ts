// server/static.ts

import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Use process.cwd() for path resolution in production
  const isProduction = process.env.NODE_ENV === 'production';
  const rootPath = isProduction ? process.cwd() : '.';
  const staticPath = `${rootPath}/public/static${pathname}`;

  // Handle SPA routing correctly
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(staticPath);
}
