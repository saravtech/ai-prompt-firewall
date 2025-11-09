// Type declaration for Prisma Client
// This ensures TypeScript can find PrismaClient during build
declare module '@prisma/client' {
  // Re-export from the generated client location
  // The path is relative to @prisma/client package
  export * from '.prisma/client/default';
}

