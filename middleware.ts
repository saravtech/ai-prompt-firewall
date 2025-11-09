import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { verifyAdminAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Protect admin API routes
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/api/policy') || pathname.startsWith('/api/logs')) {
    try {
      const isAuthenticated = await verifyAdminAuth(request);
      
      if (!isAuthenticated) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } catch (error) {
      // If auth check fails, return 401 (not 404)
      console.error('Middleware auth error:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/policy/:path*',
    '/api/logs',
    '/api/logs/:path*',
    '/api/v1/policy/:path*',
    '/api/v1/logs',
    '/api/v1/logs/:path*',
  ],
};

