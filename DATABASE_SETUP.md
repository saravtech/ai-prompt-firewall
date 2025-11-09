# Database Setup Instructions

## Issue: Can't Create Policy

You've added the DATABASE_URL, but there are two things to fix:

### 1. Fix DATABASE_URL Format

Your DATABASE_URL has an incorrect prefix. It should be:
```
postgresql://neondb_owner:npg_3LyDuCoB6WZX@ep-polished-meadow-a4h2r3bp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**NOT:**
```
psql_'_postgresql://neondb_owner:...
```

**Fix in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `DATABASE_URL`
3. Remove the `psql_'_` prefix
4. The value should start directly with `postgresql://`

### 2. Create Database Tables

After fixing the DATABASE_URL, you need to create the tables in your PostgreSQL database.

**Option A: Using Prisma DB Push (Quickest)**

1. **Set DATABASE_URL locally:**
   ```bash
   # Create .env file or add to existing .env
   DATABASE_URL="postgresql://neondb_owner:npg_3LyDuCoB6WZX@ep-polished-meadow-a4h2r3bp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   ```

2. **Push schema to database:**
   ```bash
   npx prisma db push --schema=prisma/schema.prisma
   ```

3. **Verify tables were created:**
   ```bash
   npx prisma studio --schema=prisma/schema.prisma
   ```

**Option B: Using Prisma Migrate (Recommended for Production)**

1. **Create migration:**
   ```bash
   npx prisma migrate dev --name init --schema=prisma/schema.prisma
   ```

2. **Deploy migration:**
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```

### 3. Verify Setup

After creating tables, test the connection:
```bash
npx prisma studio --schema=prisma/schema.prisma
```

This will open Prisma Studio where you can see your tables.

### 4. Redeploy on Vercel

After fixing DATABASE_URL and creating tables:
1. Commit and push your changes
2. Vercel will automatically redeploy
3. Try creating a policy again

## Quick Checklist

- [ ] Fixed DATABASE_URL in Vercel (removed `psql_'_` prefix)
- [ ] Updated Prisma schema to use `postgresql` (already done)
- [ ] Set DATABASE_URL locally
- [ ] Ran `npx prisma db push` to create tables
- [ ] Verified tables exist in database
- [ ] Redeployed on Vercel
- [ ] Tested creating a policy

## Common Issues

- **"Connection refused"**: Check DATABASE_URL format and network access
- **"Table does not exist"**: Run `npx prisma db push`
- **"Invalid connection string"**: Make sure it starts with `postgresql://` (not `psql_'_`)

