/// <reference types="../node_modules/.prisma/client/default" />

declare module '@prisma/client' {
  import { PrismaClient } from '../node_modules/.prisma/client/default';
  export { PrismaClient };
}

