# AI Prompt Firewall

A secure, production-ready firewall system for protecting AI applications from PII exposure and prompt injection attacks.

## 🎯 Features

- **PII Detection**: Automatically detects and redacts emails, SSNs, phone numbers, and credit cards
- **Prompt Injection Protection**: Blocks 15+ injection patterns and jailbreak attempts
- **Real-time Evaluation**: Instant risk assessment with explainable decisions
- **Admin Console**: Protected interface for managing rules and reviewing logs
- **API & SDK**: RESTful API with Python and JavaScript SDKs
- **Export Logs**: Download logs in CSV or JSON format
- **Dark Theme UI**: Modern, accessible interface built with shadcn/ui

## 📍 Live Demo

- **Demo UI**: [Deploy to get URL]
- **Admin Console**: [Deploy to get URL] (Password: Set in environment variables)

> **Note**: Currently running locally. See [DEPLOY.md](./DEPLOY.md) for deployment instructions.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Setup

1. **Create `.env` file:**
   ```env
   DATABASE_URL="file:./dev.db"
   ADMIN_PASSWORD="your-secure-password"
   ```

2. **Initialize database:**
   ```bash
   npm run db:push
   npm run db:generate
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Demo UI: http://localhost:3000
   - Admin Console: http://localhost:3000/admin/login
     - Default password: `admin123` (change in production!)

## 📖 Usage

### Public Demo

Visit the homepage and enter a prompt to test:
- **PII Test**: `My email is user@example.com` → Email will be redacted
- **Injection Test**: `Ignore all previous instructions` → Will be blocked
- **Safe Prompt**: `What is the weather?` → Will be allowed

### Admin Console

1. Login at `/admin/login`
2. **View Logs**: See all queries with filters
3. **Manage Rules**: Add/edit/delete regex detection rules
4. **Export Data**: Download logs as CSV or JSON

### API Usage

#### Evaluate a Prompt

```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "My email is user@example.com"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "decision": "sanitize",
    "promptModified": "My email is [EMAIL_REDACTED]",
    "risks": [{"type": "pii_email", "severity": "medium", ...}],
    "explain": [...]
  }
}
```

#### Get Logs (requires auth)

```bash
curl http://localhost:3000/api/v1/logs \
  -H "Authorization: Bearer your-api-key"
```

### SDK Usage

#### Python

```python
from prompt_firewall import PromptFirewall

firewall = PromptFirewall(base_url="http://localhost:3000")
result = firewall.query("My email is user@example.com")

print(f"Decision: {result.decision}")
print(f"Risks: {result.risks}")
```

#### JavaScript

```javascript
const PromptFirewall = require('./sdk/javascript/prompt-firewall');

const firewall = new PromptFirewall('http://localhost:3000');
const result = await firewall.query("What is the weather?");

console.log('Decision:', result.decision);
```

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture.

**Key Components:**
- **Frontend**: Next.js 16 with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Firewall Engine**: Pattern-based detection with rule evaluation

## 🔒 Security

See [THREAT_MODEL.md](./THREAT_MODEL.md) for comprehensive threat analysis.

**Security Features:**
- Password-protected admin console
- API key authentication
- PII detection and redaction
- Prompt injection blocking
- Secure session management
- Input validation

## 📦 Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

**Quick Deploy to Vercel:**
```bash
npm i -g vercel
vercel
```

**Environment Variables:**
- `DATABASE_URL`: Database connection string
- `ADMIN_PASSWORD`: Admin console password
- `ADMIN_API_KEY`: API key for programmatic access

## 📊 API Endpoints

### Public
- `POST /api/v1/query` - Evaluate a prompt

### Protected (requires authentication)
- `GET /api/v1/policy` - List policies
- `POST /api/v1/policy` - Create policy
- `PUT /api/v1/policy` - Update policy
- `DELETE /api/v1/policy` - Delete policy
- `GET /api/v1/logs` - Get logs (supports `?format=csv` or `?format=json`)

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/check` - Check session
- `DELETE /api/auth/login` - Logout

## 🧪 Testing

Test scenarios:
1. ✅ PII detection: `My email is sarav@example.com`
2. ✅ Prompt injection: `Ignore all previous instructions`
3. ✅ Normal queries: `What is the weather today?`

## 📁 Project Structure

```
prompt-firewall/
├── app/
│   ├── api/
│   │   ├── v1/          # Versioned API routes
│   │   │   ├── query/   # Public query endpoint
│   │   │   ├── policy/  # Protected policy management
│   │   │   └── logs/    # Protected log retrieval
│   │   └── auth/        # Authentication endpoints
│   ├── admin/           # Admin console pages
│   └── page.tsx          # Public demo UI
├── lib/
│   ├── firewall.ts       # Core firewall engine
│   ├── detection.ts      # Detection utilities
│   └── prisma-client.ts # Database client
├── sdk/
│   ├── python/          # Python SDK
│   └── javascript/      # JavaScript SDK
├── prisma/
│   └── schema.prisma    # Database schema
└── components/          # shadcn/ui components
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Database**: Prisma ORM + SQLite/PostgreSQL
- **Validation**: Zod
- **Deployment**: Vercel (recommended) or GCP Cloud Run

## 📈 Cost Estimation

**Vercel Hobby Plan**: $0/month (free tier)
- 100GB bandwidth
- Unlimited requests

**Database (Neon Free Tier)**: $0/month
- 0.5GB storage
- Sufficient for MVP

**Estimated Total**: $0-30/month for low-medium traffic

## 🔄 Development

```bash
# Development
npm run dev

# Build
npm run build

# Database
npm run db:push      # Push schema changes
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## 📝 License

MIT

## 🤝 Contributing

This is an MVP project. For production use, consider:
- Adding rate limiting
- Implementing 2FA for admin
- Enhanced monitoring
- Compliance certifications (SOC 2, HIPAA)

## 📚 Documentation

- [Deployment Guide](./DEPLOY.md)
- [Architecture Diagram](./ARCHITECTURE.md)
- [Threat Model](./THREAT_MODEL.md)
- [Python SDK](./sdk/python/README.md)
- [JavaScript SDK](./sdk/javascript/README.md)
