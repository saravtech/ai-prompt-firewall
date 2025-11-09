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
  // Schema is now PostgreSQL for both local and production
  // Use DATABASE_URL from environment (should be PostgreSQL connection string)
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set. Please set it in .env file or environment variables.');
  }
  
  // Clean up DATABASE_URL if it has incorrect prefix (e.g., "psql_'_postgresql://...")
  if (dbUrl.includes('postgresql://')) {
    const postgresqlIndex = dbUrl.indexOf('postgresql://');
    if (postgresqlIndex > 0) {
      dbUrl = dbUrl.substring(postgresqlIndex);
      console.log('🔧 Cleaned DATABASE_URL (removed prefix)');
    }
  }
  
  // Validate it's a PostgreSQL URL
  if (!dbUrl.startsWith('postgresql://')) {
    throw new Error(`Invalid DATABASE_URL format. Expected postgresql:// but got: ${dbUrl.substring(0, 20)}...`);
  }
  
  return dbUrl;
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
    // First, get the database URL (this will override .env for local dev)
    const databaseUrl = getDatabaseUrl();
    
    // Validate database URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    
    // Try to require PrismaClient
    let PrismaClientClass;
    try {
      const prismaModule = require('@prisma/client');
      PrismaClientClass = prismaModule.PrismaClient;
      
      if (!PrismaClientClass) {
        throw new Error('PrismaClient not found in @prisma/client');
      }
    } catch (requireError: any) {
      console.error('❌ Failed to require @prisma/client:', requireError.message);
      throw new Error(`Cannot load Prisma Client: ${requireError.message}`);
    }
    
    // Create Prisma client instance
    globalForPrisma.prisma = new PrismaClientClass({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      // Add error formatting for better debugging
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    
    // Verify the client has the log model (ensures it's not a mock)
    if (!globalForPrisma.prisma.log || typeof globalForPrisma.prisma.log.create !== 'function') {
      throw new Error('Prisma client does not have log model - might be using mock');
    }
    
    console.log('🔌 Prisma client initialized with database:', databaseUrl);
    console.log('✅ Prisma client verified - log model available');
    
    // Note: PrismaClient doesn't connect until first query, so we don't test connection here
    return globalForPrisma.prisma;
  } catch (error: any) {
    // Only use mock during build-time, otherwise use a safe fallback
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
    
    // At runtime, if Prisma fails to load, log error but return a safe mock
    // This allows the app to work even if database is unavailable
    console.error('Failed to initialize Prisma client at runtime:', error);
    console.warn('Using fallback mock client - database operations will not persist');
    
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = {
        log: {
          findMany: async () => [],
          create: async () => ({ id: 'no-db', timestamp: new Date() }),
          count: async () => 0,
        },
        policy: {
          findMany: async () => [],
          create: async () => ({ id: 'no-db', createdAt: new Date(), updatedAt: new Date() }),
          update: async () => ({ id: 'no-db', updatedAt: new Date() }),
          delete: async () => ({}),
        },
      } as any;
    }
    return globalForPrisma.prisma;
  }
}

export const prisma = getPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

