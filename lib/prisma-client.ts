import path from 'path';

// Use dynamic import to avoid build-time initialization errors
let PrismaClient: any;
let prismaClientModule: any;

// Lazy load PrismaClient only when needed (not during build-time static analysis)
async function loadPrismaClient() {
  if (!prismaClientModule) {
    try {
      prismaClientModule = await import('@prisma/client');
      PrismaClient = prismaClientModule.PrismaClient;
    } catch (error) {
      // During build, Prisma might not be generated yet - this is OK
      console.warn('Prisma client not available, will be available at runtime');
      return null;
    }
  }
  return PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

// Ensure DATABASE_URL is set correctly for both local and production
function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL;
  
  // Clean up DATABASE_URL if it has incorrect prefix (e.g., "psql_'_postgresql://...")
  if (dbUrl && dbUrl.includes('postgresql://')) {
    // Extract the actual PostgreSQL connection string
    const postgresqlIndex = dbUrl.indexOf('postgresql://');
    if (postgresqlIndex > 0) {
      dbUrl = dbUrl.substring(postgresqlIndex);
    }
  }
  
  // In production (Vercel), use the DATABASE_URL as-is (should be PostgreSQL)
  if (process.env.VERCEL || (process.env.NODE_ENV === 'production' && dbUrl && dbUrl.startsWith('postgresql://'))) {
    // Production: PostgreSQL connection string
    return dbUrl || '';
  }
  
  // Local development: check if DATABASE_URL is set, otherwise use SQLite
  if (dbUrl && dbUrl.startsWith('postgresql://')) {
    // Local but using PostgreSQL
    return dbUrl;
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

// Create Prisma client instance - lazy initialization
function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Only use mock during build-time static analysis
  // Check if we're in Next.js build phase
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

  // Try to load PrismaClient synchronously (for runtime)
  try {
    const { PrismaClient: PC } = require('@prisma/client');
    const databaseUrl = getDatabaseUrl();
    globalForPrisma.prisma = new PC({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    return globalForPrisma.prisma;
  } catch (error: any) {
    // Only use mock during build-time, otherwise throw the error
    if (isBuildTime) {
      console.warn('Prisma client not available during build, using mock');
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = {
          log: {
            findMany: async () => [],
            create: async () => ({ id: 'mock', timestamp: new Date() }),
            count: async () => 0,
          },
          policy: {
            findMany: async () => [],
            create: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
            update: async () => ({ id: 'mock', updatedAt: new Date() }),
            delete: async () => ({}),
          },
        } as any;
      }
      return globalForPrisma.prisma;
    }
    
    // At runtime, if Prisma fails to load, throw the error
    console.error('Failed to initialize Prisma client at runtime:', error);
    throw error;
  }
}

export const prisma = getPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

