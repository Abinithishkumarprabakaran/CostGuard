-- ─── USERS ───────────────────────────────────────────────────────────────────
-- Populated by the Clerk webhook at src/app/api/webhooks/clerk/route.ts
-- Verify that route is already writing to this table; if not, fix it.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  full_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
CREATE TYPE plan_type AS ENUM ('starter', 'growth', 'pro');
CREATE TYPE sub_status AS ENUM ('trialing', 'active', 'canceled', 'past_due', 'incomplete');

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id                   TEXT,                          -- Clerk org ID (if B2B team)
  stripe_customer_id       TEXT UNIQUE,
  stripe_subscription_id   TEXT UNIQUE,
  plan                     plan_type NOT NULL DEFAULT 'starter',
  status                   sub_status NOT NULL DEFAULT 'trialing',
  trial_end                TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- ─── AWS ACCOUNTS ────────────────────────────────────────────────────────────
CREATE TYPE account_status AS ENUM ('active', 'disconnected', 'error');

CREATE TABLE IF NOT EXISTS aws_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id           TEXT,                                  -- Clerk org ID
  role_arn         TEXT NOT NULL,
  aws_account_id   TEXT NOT NULL,
  account_alias    TEXT,
  external_id      TEXT NOT NULL,
  status           account_status NOT NULL DEFAULT 'active',
  connected_at     TIMESTAMPTZ DEFAULT now(),
  last_synced_at   TIMESTAMPTZ,
  UNIQUE(user_id, aws_account_id)
);

-- ─── COST SNAPSHOTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cost_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
  service          TEXT NOT NULL,
  region           TEXT NOT NULL DEFAULT 'global',
  date             DATE NOT NULL,
  blended_cost     NUMERIC(12, 4) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, service, date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_account_date ON cost_snapshots(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_service ON cost_snapshots(account_id, service, date DESC);

-- ─── SPIKE ALERTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spike_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
  service          TEXT NOT NULL,
  date             DATE NOT NULL,
  daily_cost       NUMERIC(12, 4) NOT NULL,
  avg_7d_cost      NUMERIC(12, 4) NOT NULL,
  delta_pct        NUMERIC(8, 2) NOT NULL,
  delta_usd        NUMERIC(12, 4) NOT NULL,
  ai_explanation   TEXT,
  ai_fix           TEXT,
  slack_sent_at    TIMESTAMPTZ,
  resolved         BOOLEAN DEFAULT false,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_account ON spike_alerts(account_id, date DESC);

-- ─── SLACK CONNECTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slack_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id           TEXT,
  webhook_url_enc  TEXT NOT NULL,    -- AES-256 encrypted
  channel_name     TEXT NOT NULL,
  team_name        TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── WEEKLY SUMMARY LOG ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_summary_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,
  total_spend      NUMERIC(12, 4),
  top_service      TEXT,
  slack_sent_at    TIMESTAMPTZ,
  UNIQUE(account_id, week_start)
);

-- ─── RLS: Enable on all tables ───────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aws_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spike_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summary_log ENABLE ROW LEVEL SECURITY;
