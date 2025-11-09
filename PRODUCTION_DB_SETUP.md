# Production Database Setup

## Issue: Can't Create Policy (500 Error)

The 500 error when creating a policy is likely because **the database tables don't exist in production**.

## Solution: Set Up Database Tables

### For Vercel with PostgreSQL:

1. **Set DATABASE_URL in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `DATABASE_URL` with your PostgreSQL connection string (e.g., from Neon, Supabase, etc.)

2. **Create Database Tables:**
   
   **Option A: Using Prisma Migrate (Recommended)**
   ```bash
   # Locally, create a migration
   npx prisma migrate dev --name init
   
   # Then deploy the migration
   npx prisma migrate deploy
   ```
   
   **Option B: Using Prisma DB Push (Quick Setup)**
   ```bash
   # Set DATABASE_URL environment variable first, then:
   npx prisma db push
   ```
   
   **Option C: Add to Vercel Build (Not Recommended)**
   - This requires DATABASE_URL to be available during build
   - Add to `package.json` build script (but this may fail if DB isn't accessible during build)

3. **Update Prisma Schema for Production:**
   
   If using PostgreSQL in production, you may need to update the schema:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   
   Or use environment-specific schemas.

### Quick Fix for Testing:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for database connection errors

2. **Verify DATABASE_URL:**
   - Make sure `DATABASE_URL` is set in Vercel environment variables
   - Format: `postgresql://user:password@host:port/database?sslmode=require`

3. **Run Database Setup:**
   ```bash
   # Connect to your production database and run:
   npx prisma db push --schema=prisma/schema.prisma
   ```

## Common Errors:

- **"Table does not exist"**: Run `prisma db push` or `prisma migrate deploy`
- **"Connection refused"**: Check DATABASE_URL and database accessibility
- **"Prisma client not initialized"**: Prisma client should initialize automatically, but check build logs

## Next Steps:

1. Set up PostgreSQL database (Neon, Supabase, etc.)
2. Add DATABASE_URL to Vercel environment variables
3. Run `prisma db push` or create migrations
4. Redeploy the application

