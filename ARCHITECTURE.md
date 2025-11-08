# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Public Demo UI  │              │  Admin Console    │        │
│  │  (Next.js Page)  │              │  (Protected)      │        │
│  └────────┬─────────┘              └────────┬──────────┘        │
│           │                                 │                    │
└───────────┼─────────────────────────────────┼────────────────────┘
            │                                 │
            │ HTTP/HTTPS                      │ HTTP/HTTPS
            │                                 │
┌───────────▼─────────────────────────────────▼────────────────────┐
│                    Next.js API Routes (Serverless)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/v1/    │  │ /api/v1/     │  │ /api/v1/     │          │
│  │ query       │  │ policy       │  │ logs         │          │
│  │ (Public)    │  │ (Protected)  │  │ (Protected)  │          │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                │                  │                   │
└─────────┼────────────────┼──────────────────┼───────────────────┘
          │                │                  │
          │                │                  │
┌─────────▼────────────────▼──────────────────▼───────────────────┐
│                    Firewall Engine                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  evaluatePrompt(prompt, response, rules)                  │   │
│  │                                                            │   │
│  │  • PII Detection (emails, SSNs, phones, credit cards)    │   │
│  │  • Injection Detection (15+ patterns)                     │   │
│  │  • Rule Evaluation                                        │   │
│  │  • Risk Scoring                                           │   │
│  │  • Decision: allow/block/modify/sanitize                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────┬────────────────────────────────────────────────────────┘
          │
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                         Database Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Logs Table     │              │  Policies Table  │         │
│  │                  │              │                  │         │
│  │ • id             │              │ • id             │         │
│  │ • prompt         │              │ • name           │         │
│  │ • response       │              │ • rules (JSON)   │         │
│  │ • decision       │              │ • enabled        │         │
│  │ • risks          │              │ • timestamps     │         │
│  │ • metadata       │              │                  │         │
│  └──────────────────┘              └──────────────────┘         │
│                                                                   │
│  Local Dev: SQLite (file:./dev.db)                               │
│  Production: PostgreSQL (Neon/Supabase)                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Query Flow
```
User Input → /api/v1/query → Firewall Engine → Database (Log) → Response
     │              │              │
     │              │              ├─→ PII Detection
     │              │              ├─→ Injection Detection
     │              │              └─→ Rule Evaluation
     │              │
     │              └─→ Load Policies from DB
     │
     └─→ Display Result (Decision, Risks, Modified Prompt)
```

### 2. Admin Console Flow
```
Admin Login → /admin/login → Session Auth → /admin
     │
     ├─→ View Logs → /api/v1/logs → Database
     ├─→ Manage Policies → /api/v1/policy → Database
     └─→ Export Logs → CSV/JSON Download
```

## Component Details

### Frontend (Next.js App Router)
- **Pages**: 
  - `/` - Public demo UI
  - `/admin/login` - Admin authentication
  - `/admin` - Protected admin console
- **Components**: shadcn/ui (Button, Card, Table, etc.)
- **Styling**: Tailwind CSS v4 with dark theme

### Backend (Next.js API Routes)
- **Public Endpoints**:
  - `POST /api/v1/query` - Evaluate prompts
- **Protected Endpoints** (require auth):
  - `GET/POST/PUT/DELETE /api/v1/policy` - Policy management
  - `GET /api/v1/logs` - Log retrieval and export
- **Auth Endpoints**:
  - `POST /api/auth/login` - Admin login
  - `GET /api/auth/check` - Session validation

### Firewall Engine (`lib/firewall.ts`)
- **Input**: Prompt, Response (optional), Rules
- **Output**: Decision, Modified Prompt, Risks, Explanations
- **Detection**:
  - PII: Email, SSN, Phone, Credit Card regex patterns
  - Injection: 15+ pattern-based heuristics
- **Actions**: Block, Sanitize, Modify, Warn

### Database (Prisma ORM)
- **Schema**: Log and Policy models
- **Local**: SQLite for development
- **Production**: PostgreSQL (Neon/Supabase)
- **Migrations**: Prisma migrations

## Security Layers

1. **Authentication**: Password + Session tokens
2. **Authorization**: Middleware protection for admin routes
3. **Input Validation**: Zod schemas
4. **PII Protection**: Automatic detection and redaction
5. **Injection Prevention**: Pattern-based blocking

## Scalability

- **Serverless**: Auto-scaling on Vercel/Cloud Run
- **Database**: Connection pooling ready
- **Caching**: Can add Redis for policy caching
- **CDN**: Static assets via Vercel Edge Network

## Deployment Architecture

### Vercel Deployment
```
GitHub → Vercel Build → Edge Network → Serverless Functions
                                    ↓
                              PostgreSQL (Neon)
```

### GCP Cloud Run
```
Container Registry → Cloud Run → Load Balancer
                              ↓
                        Cloud SQL / Neon
```

## Monitoring Points

1. API response times
2. Database query performance
3. Error rates
4. Authentication failures
5. Blocked requests count
6. PII detection rates

