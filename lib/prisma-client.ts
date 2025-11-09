import { PrismaClient } from './prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is set with absolute path and file: protocol
function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL;
  
  // Always use absolute path to avoid issues
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  const absoluteUrl = `file:${dbPath}`;
  
  // Set it in process.env so Prisma schema validation works
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
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

