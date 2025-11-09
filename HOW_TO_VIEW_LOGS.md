# How to View Logs

## Where to See Logs

### 1. Admin Console (Web UI) - **Easiest Way**

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Go to Admin Console**:
   - Open: http://localhost:3000/admin (or 3001 if 3000 is in use)
   - If prompted, login with admin credentials

3. **Click on "Logs" tab**:
   - The logs tab shows all firewall query logs
   - You'll see:
     - Timestamp
     - Decision (ALLOW/BLOCK/SANITIZE)
     - Risk Type (PII, Injection, etc.)
     - Prompt text
     - Blocked status

4. **Filter Logs**:
   - Use the filter options to show:
     - Logs with PII
     - Logs with Injection attempts
     - Blocked queries
     - Specific risk types

5. **Export Logs**:
   - Click "Export CSV" or "Export JSON" buttons
   - Downloads all filtered logs

### 2. API Endpoint (Programmatic Access)

You can also access logs via API:

```bash
# Get all logs
curl http://localhost:3000/api/logs

# Get logs with filters
curl "http://localhost:3000/api/logs?hasPII=true&blocked=true"

# Export as CSV
curl "http://localhost:3000/api/logs?format=csv" -o logs.csv

# Export as JSON
curl "http://localhost:3000/api/logs?format=json" -o logs.json
```

### 3. Server Console Logs (Terminal)

When you run `npm run dev`, you'll see:
- Database connection logs
- Prisma client initialization logs
- API request logs
- Error messages

### 4. Database Direct Access

You can also view logs directly in the database:

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio --schema=prisma/schema.prisma

# This opens a web interface at http://localhost:5555
# Navigate to the "Log" table to see all logs
```

## What Gets Logged?

Every time someone uses the firewall (clicks "Run Firewall"), it logs:
- ✅ The prompt text
- ✅ The response (if allowed)
- ✅ Decision (allow/block/sanitize)
- ✅ Detected risks (PII types, injection attempts)
- ✅ Risk score
- ✅ Timestamp
- ✅ Whether it was blocked

## Quick Test

1. **Generate some logs**:
   - Go to http://localhost:3000
   - Enter prompts like:
     - "My email is test@example.com" (will detect PII)
     - "Ignore previous instructions" (will detect injection)
   - Click "Run Firewall" for each

2. **View the logs**:
   - Go to http://localhost:3000/admin
   - Click "Logs" tab
   - You should see all the queries you just made!

## Troubleshooting

**If you see "No logs found":**
- Make sure you've run some queries first (use the firewall on the home page)
- Check that the database is working (logs are stored in `dev.db`)
- Verify you're logged into the admin panel

**If logs don't appear:**
- Check the browser console for errors
- Check the terminal where `npm run dev` is running for server errors
- Make sure the database tables exist (run `npx prisma db push` if needed)

