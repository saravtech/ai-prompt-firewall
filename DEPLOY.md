# Deployment Guide

## Tech Stack

- **Frontend**: Next.js 16 (React 19) with TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Next.js API Routes (serverless)
- **Database**: SQLite (local dev) / PostgreSQL (production via Neon)
- **ORM**: Prisma
- **Deployment**: Vercel (recommended) or GCP Cloud Run

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for deployment) or GCP account (for Cloud Run)

## Local Development Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   ADMIN_PASSWORD="your-secure-password"
   ADMIN_API_KEY="your-api-key"
   ```

3. **Initialize database:**
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Demo UI: http://localhost:3000
   - Admin Console: http://localhost:3000/admin/login
     - Default password: `admin123` (change in production!)

## Deployment to Vercel

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login and deploy:**
   ```bash
   vercel login
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g., from Neon)
   - `ADMIN_PASSWORD`: Secure admin password
   - `ADMIN_API_KEY`: API key for programmatic access
   - `ADMIN_SESSION_TOKEN`: Random session token (generate with `openssl rand -hex 32`)

4. **Deploy production:**
   ```bash
   vercel --prod
   ```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy automatically on push

## Deployment to GCP Cloud Run

1. **Build Docker image:**
   ```bash
   docker build -t prompt-firewall .
   ```

2. **Push to Google Container Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/prompt-firewall
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy prompt-firewall \
     --image gcr.io/PROJECT_ID/prompt-firewall \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="your-postgres-url",ADMIN_PASSWORD="your-password"
   ```

## Database Setup (Production)

### Using Neon (PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update Prisma schema to use PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Using Supabase

Similar process - create project, get connection string, update schema.

## Environment Variables

### Required

- `DATABASE_URL`: Database connection string
  - Local: `file:./dev.db`
  - Production: PostgreSQL connection string

### Optional (with defaults)

- `ADMIN_PASSWORD`: Admin console password (default: `admin123`)
- `ADMIN_API_KEY`: API key for programmatic access
- `ADMIN_SESSION_TOKEN`: Session token for admin authentication

## Security Checklist

- [ ] Change default `ADMIN_PASSWORD` in production
- [ ] Generate strong `ADMIN_API_KEY` and `ADMIN_SESSION_TOKEN`
- [ ] Use HTTPS (automatic on Vercel/Cloud Run)
- [ ] Store secrets in environment variables (never commit)
- [ ] Enable database backups
- [ ] Set up rate limiting (consider Vercel Pro or Cloud Armor)
- [ ] Monitor logs for suspicious activity

## Cost Estimation

### Vercel (Hobby Plan)
- **Free tier**: 100GB bandwidth, unlimited requests
- **Pro plan**: $20/month - 1TB bandwidth, better performance
- **Database**: Neon free tier (0.5GB) or Supabase free tier

### GCP Cloud Run
- **Compute**: ~$0.40 per million requests
- **Database**: Cloud SQL PostgreSQL ~$7-25/month (or use Neon free tier)

**Estimated monthly cost**: $0-30 for low-medium traffic

## Post-Deployment

1. **Test the public demo:**
   - Visit your deployed URL
   - Test with sample prompts

2. **Access admin console:**
   - Go to `/admin/login`
   - Login with your password

3. **Configure policies:**
   - Create custom detection rules
   - Test with various prompts

4. **Monitor:**
   - Check Vercel/Cloud Run logs
   - Review database usage
   - Monitor API response times

## Troubleshooting

### Database connection errors
- Verify `DATABASE_URL` is set correctly
- Check database is accessible from deployment region
- Ensure Prisma migrations have run

### Authentication issues
- Verify environment variables are set
- Check cookie settings (HTTPS required in production)
- Clear browser cookies and try again

### Build errors
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility
- Review build logs in deployment platform

## Support

For issues or questions, check:
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- Vercel docs: https://vercel.com/docs

