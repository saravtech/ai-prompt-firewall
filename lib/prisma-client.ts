import { PrismaClient } from './prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is set with absolute path
if (!process.env.DATABASE_URL) {
  const dbPath = path.join(process.cwd(), 'dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
} else if (process.env.DATABASE_URL.startsWith('file:./')) {
  // Convert relative path to absolute
  const relativePath = process.env.DATABASE_URL.replace('file:', '');
  const dbPath = path.resolve(process.cwd(), relativePath);
  process.env.DATABASE_URL = `file:${dbPath}`;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'dev.db')}`,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

