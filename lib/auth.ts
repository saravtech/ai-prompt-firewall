import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for dev, should be set in production

export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;
  
  // Check if valid session token exists (starts with "session_")
  // In production, validate against a database or use JWT
  if (sessionToken && sessionToken.startsWith('session_')) {
    return true;
  }
  
  // Check Authorization header for API access
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === process.env.ADMIN_API_KEY || token === 'dev-api-key') {
      return true;
    }
  }
  
  return false;
}

export async function checkPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}

export function generateSessionToken(): string {
  // In production, use crypto.randomBytes or similar
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

