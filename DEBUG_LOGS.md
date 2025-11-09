# Debug: Why Logs Aren't Showing

## Quick Checklist

### 1. Are you logged into Admin Panel?
- Go to http://localhost:3000/admin
- If you see a login page, log in with password: `admin123` (default)
- You must be logged in to see logs

### 2. Are logs being created?
Check the terminal where `npm run dev` is running. You should see:
- `✅ Log created successfully: [id]` - Logs are being saved
- `⚠️ Database not available` - Database issue
- `❌ Could not log query to database` - Error saving logs

### 3. Check Browser Console
1. Open Admin Panel: http://localhost:3000/admin
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for:
   - `📊 Logs loaded: X logs` - Logs are loading
   - `⚠️ Not authenticated` - Need to log in
   - `❌ Failed to load logs` - API error

### 4. Test Database Directly

Open Prisma Studio to see if logs exist:
```bash
npx prisma studio --schema=prisma/schema.prisma
```

This opens at http://localhost:5555
- Navigate to "Log" table
- Check if your test queries are there

### 5. Test API Directly

```bash
# First, get a session cookie by logging in via browser
# Then test the API:
curl http://localhost:3000/api/logs -H "Cookie: admin_session=session_xxx"
```

## Common Issues

### Issue 1: Not Logged In
**Symptom**: Admin panel redirects to login or shows "Unauthorized"
**Fix**: 
1. Go to http://localhost:3000/admin/login
2. Enter password: `admin123`
3. Click Login

### Issue 2: Logs Not Being Saved
**Symptom**: No `✅ Log created successfully` in terminal
**Fix**:
1. Check terminal for database errors
2. Verify `dev.db` exists: `ls dev.db` (or `dir dev.db` on Windows)
3. Run: `npx prisma db push --schema=prisma/schema.prisma`

### Issue 3: Authentication Cookie Missing
**Symptom**: Console shows "Not authenticated"
**Fix**:
1. Clear browser cookies
2. Log in again at http://localhost:3000/admin/login
3. Make sure cookies are enabled

### Issue 4: Database Connection Issue
**Symptom**: Terminal shows database errors
**Fix**:
1. Restart dev server
2. Check `lib/prisma-client.ts` is using SQLite locally
3. Verify `dev.db` file exists

## Step-by-Step Debug

1. **Run a test query**:
   - Go to http://localhost:3000
   - Enter: "My email is test@example.com"
   - Click "Run Firewall"

2. **Check terminal**:
   - Should see: `✅ Log created successfully: [id]`
   - If not, there's a database issue

3. **Check Admin Panel**:
   - Go to http://localhost:3000/admin
   - Make sure you're logged in
   - Check Console (F12) for errors
   - Should see: `📊 Logs loaded: 1 logs`

4. **Check Database**:
   - Run: `npx prisma studio`
   - Open Log table
   - Should see your test query

## Still Not Working?

Share:
1. What you see in terminal when running a query
2. What you see in browser console (F12 → Console)
3. Whether you're logged into admin panel
4. Any error messages

