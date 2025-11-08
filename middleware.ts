import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { verifyAdminAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Protect admin API routes
  if (request.nextUrl.pathname.startsWith('/api/policy') || 
      request.nextUrl.pathname.startsWith('/api/logs')) {
    const isAuthenticated = await verifyAdminAuth(request);
    
    if (!isAuthenticated) {
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
    '/api/logs/:path*',
    '/api/v1/policy/:path*',
    '/api/v1/logs/:path*',
  ],
};

