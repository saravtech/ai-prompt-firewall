import { PrismaClient } from './prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is set correctly for both local and production
function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL;
  
  // In production (Vercel), use the DATABASE_URL as-is (should be PostgreSQL)
  if (process.env.VERCEL || (process.env.NODE_ENV === 'production' && dbUrl && !dbUrl.startsWith('file:'))) {
    // Production: PostgreSQL connection string
    return dbUrl || '';
  }
  
  // Local development: use SQLite with absolute path
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  const absoluteUrl = `file:${dbPath}`;
  
  // Set it in process.env so Prisma schema validation works
  if (!dbUrl || dbUrl.startsWith('file:')) {
    process.env.DATABASE_URL = absoluteUrl;
  }
  
  return absoluteUrl;
}

const databaseUrl = getDatabaseUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

