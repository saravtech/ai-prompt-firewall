# Quick Deployment Guide (5 Minutes)

## Step 1: Deploy to Vercel (2 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

## Step 2: Set Up Database (2 minutes)

1. Go to [neon.tech](https://neon.tech) and create free account
2. Create new project
3. Copy connection string (looks like: `postgresql://user:pass@host/dbname`)
4. In Vercel dashboard → Your Project → Settings → Environment Variables:
   - Add `DATABASE_URL` = your PostgreSQL connection string
   - Add `ADMIN_PASSWORD` = your secure password
   - Add `ADMIN_API_KEY` = generate a random string

## Step 3: Update Database Schema (1 minute)

After setting DATABASE_URL, run migrations:

```bash
# In Vercel dashboard, go to your deployment
# Or use Vercel CLI:
vercel env pull .env.local

# Update Prisma schema to use PostgreSQL
# Edit prisma/schema.prisma:
# Change: provider = "sqlite"
# To: provider = "postgresql"

# Push schema
npx prisma db push
```

## Step 4: Redeploy (automatic)

Vercel will automatically redeploy when you update environment variables.

## Step 5: Get Your URLs

- **Demo UI**: `https://your-project.vercel.app`
- **Admin Console**: `https://your-project.vercel.app/admin`
- **API**: `https://your-project.vercel.app/api/v1`

## Done! ✅

Your application is now live and accessible.

---

## Alternative: GCP Cloud Run

If you prefer GCP:

```bash
# Build
gcloud builds submit --tag gcr.io/PROJECT_ID/prompt-firewall

# Deploy
gcloud run deploy prompt-firewall \
  --image gcr.io/PROJECT_ID/prompt-firewall \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="your-postgres-url",ADMIN_PASSWORD="your-password"
```

