# Troubleshooting: "Failed to process prompt" Error

## Quick Fixes

### 1. Check Vercel Logs
The most important step is to check what error is actually happening:

1. Go to Vercel Dashboard → Your Project → Logs
2. Look for errors when you click "Run Firewall"
3. Common errors you might see:
   - `Table does not exist` → Database tables need to be created
   - `Connection refused` → DATABASE_URL is incorrect or database is not accessible
   - `Invalid connection string` → DATABASE_URL format is wrong

### 2. Verify DATABASE_URL Format

Your DATABASE_URL should be:
```
postgresql://user:password@host:port/database?sslmode=require
```

**NOT:**
```
psql_'_postgresql://...
```

**Fix in Vercel:**
1. Settings → Environment Variables
2. Edit `DATABASE_URL`
3. Remove any prefixes (should start directly with `postgresql://`)

### 3. Create Database Tables

Even with a correct DATABASE_URL, you need to create the tables:

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-postgresql-connection-string"

# Create tables
npx prisma db push --schema=prisma/schema.prisma
```

### 4. Regenerate Prisma Client

After changing the schema (we changed from SQLite to PostgreSQL), regenerate:

```bash
npx prisma generate --schema=prisma/schema.prisma
```

## Testing Locally

1. **Set DATABASE_URL:**
   ```bash
   # Create .env file
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```

2. **Create tables:**
   ```bash
   npx prisma db push
   ```

3. **Test the query API:**
   ```bash
   npm run dev
   # Then test in browser or with curl:
   curl -X POST http://localhost:3000/api/query \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test"}'
   ```

## Common Error Messages

### "Failed to process prompt"
- **Cause**: Network error, server error, or invalid response
- **Fix**: Check Vercel logs for the actual error

### "Table does not exist"
- **Cause**: Database tables haven't been created
- **Fix**: Run `npx prisma db push`

### "Connection refused" or "Connection timeout"
- **Cause**: DATABASE_URL is wrong or database is not accessible
- **Fix**: Verify DATABASE_URL and check database firewall settings

### "Invalid connection string"
- **Cause**: DATABASE_URL has wrong format
- **Fix**: Ensure it starts with `postgresql://` (not `psql_'_`)

## Debug Steps

1. ✅ Check Vercel logs for actual error
2. ✅ Verify DATABASE_URL format in Vercel
3. ✅ Create database tables with `prisma db push`
4. ✅ Regenerate Prisma client with `prisma generate`
5. ✅ Test locally first before deploying
6. ✅ Check browser console for detailed error messages (now improved)

## What Was Fixed

1. **Better error handling** in `/api/query` route
2. **Improved frontend error messages** - now shows actual error details
3. **Graceful database error handling** - firewall works even if database is unavailable
4. **Prisma client validation** - better error messages for connection issues

The firewall should now work even if the database is not set up (it will use default rules), but you'll get better error messages to help you fix the database setup.

