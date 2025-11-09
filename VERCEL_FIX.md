# Fixing Prisma Query Engine Error on Vercel

## Problem
Error: `Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"`

This happens because Prisma needs platform-specific binaries, and Vercel runs on Linux.

## Solution Applied

1. **Updated `prisma/schema.prisma`**:
   - Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to generate the correct binary for Vercel

2. **Updated `package.json`**:
   - Added `postinstall` script to generate Prisma client during Vercel build
   - Updated `build` script to generate Prisma client before building

3. **Updated `lib/prisma-client.ts`**:
   - Fixed DATABASE_URL handling for production (PostgreSQL) vs local (SQLite)

## Next Steps

1. **Regenerate Prisma client locally**:
   ```bash
   npm run db:generate
   ```

2. **Commit and push**:
   ```bash
   git add prisma/schema.prisma package.json lib/prisma-client.ts
   git commit -m "Fix Prisma query engine for Vercel deployment"
   git push
   ```

3. **Vercel will automatically rebuild** with the correct Prisma binaries

4. **If you're using PostgreSQL in production** (recommended):
   - Make sure `DATABASE_URL` in Vercel is set to your PostgreSQL connection string
   - Update `prisma/schema.prisma` datasource to `provider = "postgresql"` for production
   - Or use environment-specific schemas

## Important: Database Provider

**For Production on Vercel, you MUST use PostgreSQL** (not SQLite):
- SQLite files don't work in serverless environments
- Use Neon (free tier) or Supabase
- Update `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"  // Change from "sqlite"
    url      = env("DATABASE_URL")
  }
  ```

Then run migrations:
```bash
npx prisma migrate deploy
```

