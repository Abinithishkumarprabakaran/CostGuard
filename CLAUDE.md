# CLAUDE.md — Cost Guard (AWS Cost Alert)

## Project Overview

Cost Guard is a B2B SaaS platform that monitors AWS spending in real time, detects cost anomalies, generates AI-powered root cause analysis via Claude Haiku, and delivers alerts to Slack. It supports multiple AWS accounts per organization with a three-tier subscription model billed through Stripe.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (serverless) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| Auth | Clerk (org-aware, RBAC) |
| Database | Supabase PostgreSQL + RLS |
| Payments | Stripe (Starter / Growth / Pro) |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Alerts | Slack webhooks (AES-256 encrypted at rest) |
| Email | Resend |
| Rate limiting | Upstash Redis (sliding window) |
| Job queues | Upstash QStash |
| Deployment | Vercel (serverless functions + cron) |
| AWS | Cost Explorer API + STS role assumption |

---

## Repository Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — Clerk provider
│   ├── middleware.ts               # Clerk auth middleware — public/protected route split
│   ├── page.tsx                    # Entry point — redirects to /dashboard or landing
│   ├── accounts/                   # AWS account connection UI
│   ├── alerts/                     # Spike alert log with AI detail panel
│   ├── billing/                    # Stripe subscription + invoice management
│   ├── dashboard/                  # KPI cards, spend breakdown, anomaly feed
│   ├── onboarding/                 # IAM role setup guide (CloudFormation flow)
│   ├── optimization/               # AI cost optimization recommendations
│   ├── reports/                    # Monthly trend reports + forecasts
│   ├── settings/                   # General, notifications, security, team tabs
│   └── api/
│       ├── accounts/               # CRUD + role verify + external ID generation
│       ├── alerts/                 # List + resolve
│       ├── billing/                # Stripe checkout + portal
│       ├── cron/
│       │   ├── nightly-cost-fetch/ # Runs 02:00 UTC daily — fetch → detect → alert
│       │   └── weekly-report/      # Runs 04:00 UTC Monday — weekly Slack summary
│       ├── dashboard/              # Aggregated KPI endpoint
│       ├── optimization/           # AI recommendations
│       ├── reports/                # Monthly spend data
│       ├── slack/                  # Webhook save/delete/test
│       └── webhooks/
│           ├── clerk/              # Sync Clerk users/orgs to Supabase
│           └── stripe/             # Subscription lifecycle events
├── components/
│   ├── dashboard/                  # DashboardClient and subcomponents
│   ├── landing/                    # Marketing landing page sections
│   ├── layout/                     # AppShell, Header, Sidebar
│   ├── pricing/                    # Pricing tier cards
│   └── ui/                         # Badge, Button, Card, Table primitives
└── lib/
    ├── anthropic.ts                # Claude Haiku — spike explanation + fix generation
    ├── aws.ts                      # STS role assumption + Cost Explorer queries
    ├── rate-limit.ts               # Upstash sliding window (api: 20/10s, strict: 5/60s)
    ├── slack.ts                    # AES-256 encrypt/decrypt + Slack message formatting
    ├── spike-detection.ts          # Anomaly algorithm (>30% AND >$50 vs 7-day avg)
    ├── stripe.ts                   # Stripe client
    ├── supabase-admin.ts           # Service-role Supabase client (server only)
    ├── supabase.ts                 # Anon Supabase client (browser)
    ├── rbac.ts / roles.ts          # Clerk org permission helpers
    └── utils.ts                    # General utilities
public/
└── cloudformation/
    └── cost-guard-iam-role.yaml    # Customer-deployable read-only IAM role template
supabase_schema.sql                 # Full DB schema with RLS policies
vercel.json                         # Cron job schedule declarations
```

---

## Database Schema

All tables have Row Level Security (RLS) enabled. Use `supabase-admin.ts` (service role) for all server-side writes; never expose the service role key to the browser.

| Table | Purpose |
|---|---|
| `users` | Clerk-synced user profiles |
| `subscriptions` | Stripe plan + status per user/org |
| `aws_accounts` | Connected accounts: role ARN, external ID, status |
| `cost_snapshots` | Daily cost per service/region (indexed on account + date) |
| `spike_alerts` | Detected anomalies + AI explanation/fix + Slack delivery status |
| `slack_connections` | AES-256 encrypted webhook URLs |
| `weekly_summary_log` | Record of each weekly Slack summary sent |

See `supabase_schema.sql` for full DDL and RLS policies.

---

## Core Business Logic

### Spike Detection (`src/lib/spike-detection.ts`)
A service spike is flagged when **both** conditions are met:
- Daily cost is **>30%** above the trailing 7-day average
- Absolute dollar increase is **>$50**

### Nightly Cron (`src/app/api/cron/nightly-cost-fetch/route.ts`)
1. Fetch all active `aws_accounts`
2. Assume each account's IAM role via STS
3. Pull last 7 days of costs from Cost Explorer grouped by SERVICE
4. Run spike detection per service
5. Call Claude Haiku to explain each spike (cause, fix, confidence)
6. Save alerts to `spike_alerts`, save costs to `cost_snapshots`
7. Send Slack alert if `slack_connections` row exists for the org

### Weekly Cron (`src/app/api/cron/weekly-report/route.ts`)
Runs every Monday at 04:00 UTC. Aggregates current vs prior week spend, identifies top service, and sends a Slack summary.

### IAM Role Assumption
Cost Guard never stores long-term AWS credentials for customers. Each connected account provides a role ARN + external ID. STS `AssumeRole` is called at runtime per request. The CloudFormation template in `public/cloudformation/` provisions the required read-only role in the customer's account.

---

## Authentication & Authorization

- **Clerk** manages all user and org authentication.
- Middleware (`src/middleware.ts`) splits public routes (`/`, `/sign-in`, `/sign-up`, `/api/webhooks/clerk`) from protected routes (everything else).
- Organization membership is enforced — org ID is required for API access beyond auth pages.
- **RBAC helpers** in `src/lib/rbac.ts` and `src/lib/roles.ts` check Clerk org roles before sensitive operations.
- Cron endpoints are protected by a `CRON_SECRET` bearer token verified in the handler.

---

## Security Conventions

- **Never** put the Supabase service role key or any secret in client-side code.
- Slack webhook URLs are AES-256 encrypted using `ENCRYPTION_KEY` before being written to the database. Always use `encryptWebhookUrl` / `decryptWebhookUrl` from `src/lib/slack.ts`.
- IAM external IDs must be validated on every `AssumeRole` call to prevent confused deputy attacks.
- All API routes that mutate state must call the appropriate rate limiter from `src/lib/rate-limit.ts` before processing.
- Input validation uses **Zod** schemas at API boundaries.

---

## Environment Variables

Create a `.env.local` file with all variables below. Never commit this file.

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AWS (Cost Guard's own account — used to assume customer roles)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
COST_GUARD_AWS_ACCOUNT_ID=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_PRO=
STRIPE_TRIAL_DAYS=14

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL_DOMAIN=

# Slack encryption
ENCRYPTION_KEY=                     # 64-char hex string (openssl rand -hex 32)

# Cron auth
CRON_SECRET=                        # Random secret — must match vercel.json cron header

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=
CLOUDFORMATION_TEMPLATE_URL=
```

---

## Development Workflow

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Lint
npm run lint

# Build
npm run build
```

The app runs on `http://localhost:3000`. Cron jobs won't execute locally — test them by calling the route directly with the `Authorization: Bearer <CRON_SECRET>` header.

---

## Deployment (Vercel)

- All environment variables must be set in the Vercel project dashboard.
- Cron schedules are declared in `vercel.json` and managed by Vercel infrastructure.
- The Stripe webhook endpoint (`/api/webhooks/stripe`) and Clerk webhook endpoint (`/api/webhooks/clerk`) must be registered in their respective dashboards pointing to the production URL.

---

## Known Gaps / TODO

- [ ] Settings page (`src/app/settings/`) — General and Notifications tabs are UI-only; save/persist logic not yet wired to backend
- [ ] No `.env.example` file — should be added and kept in sync with this document
- [ ] Email digests (Resend) — toggle exists in settings UI but send logic is not implemented
- [ ] API key management in settings security tab — generation and revocation not yet implemented
- [ ] Error boundaries on frontend pages are minimal

---

## Adding a New API Route

1. Create `src/app/api/<resource>/route.ts`
2. Import `auth` from Clerk to get `userId` / `orgId`
3. Call the appropriate rate limiter at the top of the handler
4. Validate request body with a Zod schema
5. Use `supabase-admin.ts` for DB writes, `supabase.ts` only for reads that go through RLS
6. Return typed JSON responses with explicit HTTP status codes

## Adding a New Page

1. Create `src/app/<page>/page.tsx` as a server component
2. Add client interactivity in a separate `*Client.tsx` component
3. The Clerk middleware protects all routes by default — no extra guard needed unless the route should be public
