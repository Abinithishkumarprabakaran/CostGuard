/**
 * Tests for GET /api/dashboard
 * The real route now makes 6 Supabase calls:
 *  1. users lookup
 *  2. aws_accounts lookup
 *  3. cost_snapshots (current month)
 *  4. cost_snapshots (last month)
 *  5. cost_snapshots (last 30 days)
 *  6. spike_alerts (active)
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));

const mockLimit = jest.fn().mockResolvedValue({ success: true });
jest.mock("@/lib/rate-limit", () => ({
  apiRateLimit: { limit: mockLimit },
  strictRateLimit: { limit: mockLimit },
}));

const mockSupabaseFrom = jest.fn();
jest.mock("@/lib/supabase-admin", () => ({
  createAdminSupabaseClient: () => ({ from: mockSupabaseFrom }),
}));

// ── Imports ────────────────────────────────────────────────────────────────

import { GET } from "@/app/api/dashboard/route";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Snapshot chain terminating at .lte() — for current and last month queries */
function snapshotChain(result: { data: any[] | null }) {
  const chain: any = {};
  ["select", "in", "gte"].forEach((m) => (chain[m] = jest.fn().mockReturnValue(chain)));
  chain.lte = jest.fn().mockResolvedValue(result);
  return chain;
}

/** Snapshot chain terminating at .order() — for 30-day chart query */
function snapshotChainOrdered(result: { data: any[] | null }) {
  const chain: any = {};
  ["select", "in", "gte", "lte"].forEach((m) => (chain[m] = jest.fn().mockReturnValue(chain)));
  chain.order = jest.fn().mockResolvedValue(result);
  return chain;
}

/** Chain for spike_alerts — terminal is .limit() */
function alertChain(result: { data: any[] | null }) {
  const chain: any = {};
  ["select", "in"].forEach((m) => (chain[m] = jest.fn().mockReturnValue(chain)));
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockResolvedValue(result);
  return chain;
}

/** Standard user lookup chain */
function userChain(data: any) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data }),
  } as any;
}

/** aws_accounts lookup chain — terminal is second .eq() */
function accountsChain(data: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data }),
  } as any;
}

/** Set up the 6-call sequence for a user with accounts */
function mockFullDashboard({
  currentSnaps = [],
  lastSnaps = [],
  thirtySnaps = [],
  alerts = [],
}: {
  currentSnaps?: any[];
  lastSnaps?: any[];
  thirtySnaps?: any[];
  alerts?: any[];
}) {
  mockSupabaseFrom
    .mockReturnValueOnce(userChain({ id: "db_u1" }))
    .mockReturnValueOnce(accountsChain([{ id: "acc1" }]))
    .mockReturnValueOnce(snapshotChain({ data: currentSnaps }))
    .mockReturnValueOnce(snapshotChain({ data: lastSnaps }))
    .mockReturnValueOnce(snapshotChainOrdered({ data: thirtySnaps }))
    .mockReturnValueOnce(alertChain({ data: alerts }));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/dashboard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockLimit.mockResolvedValueOnce({ success: false });
    const res = await GET();
    expect(res.status).toBe(429);
  });

  it("returns 404 when user not in DB", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockSupabaseFrom.mockReturnValue(userChain(null));
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns noAccountsConnected payload when user has no accounts", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockSupabaseFrom
      .mockReturnValueOnce(userChain({ id: "db_u1" }))
      .mockReturnValueOnce(accountsChain([]));

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.noAccountsConnected).toBe(true);
    expect(json.currentMonthSpend).toBe(0);
    expect(json.activeAnomalies).toBe(0);
  });

  it("aggregates currentMonthSpend from cost_snapshots", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockFullDashboard({
      currentSnaps: [
        { date: "2026-03-01", service: "EC2", blended_cost: "100.00" },
        { date: "2026-03-02", service: "S3",  blended_cost: "50.00" },
      ],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.currentMonthSpend).toBeCloseTo(150);
    expect(json.noAccountsConnected).toBe(false);
  });

  it("returns active anomaly count from spike_alerts", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockFullDashboard({
      alerts: [
        { service: "Lambda", delta_pct: "312", ai_explanation: "Loop", aws_accounts: { account_alias: "prod" } },
        { service: "EC2",    delta_pct: "45",  ai_explanation: "Scale", aws_accounts: { account_alias: "dev" } },
      ],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.activeAnomalies).toBe(2);
    expect(json.recentAnomalies[0].service).toBe("Lambda");
    expect(json.recentAnomalies[0].severity).toBe("Critical");
    expect(json.recentAnomalies[1].severity).toBe("Warning");
  });

  it("computes spendByService grouped from current snapshots", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockFullDashboard({
      currentSnaps: [
        { date: "2026-03-01", service: "EC2", blended_cost: "200" },
        { date: "2026-03-02", service: "EC2", blended_cost: "100" },
        { date: "2026-03-01", service: "RDS", blended_cost: "80"  },
      ],
    });

    const res = await GET();
    const json = await res.json();
    const ec2 = json.spendByService.find((s: any) => s.name === "EC2");
    expect(ec2).toBeDefined();
    expect(ec2.value).toBeCloseTo(300);
  });

  it("response contains all required dashboard keys", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockFullDashboard({});

    const res = await GET();
    const json = await res.json();
    const requiredKeys = [
      "currentMonthSpend", "lastMonthSpend", "percentChange",
      "forecastedSpend", "activeAnomalies", "potentialSavings",
      "costOverTime", "spendByService", "topCostDrivers", "recentAnomalies",
    ];
    requiredKeys.forEach((key) => expect(json).toHaveProperty(key));
  });

  it("percentChange is 0 when last month spend is zero", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockFullDashboard({
      currentSnaps: [{ date: "2026-03-01", service: "EC2", blended_cost: "500" }],
      lastSnaps: [],
    });

    const res = await GET();
    const json = await res.json();
    expect(json.percentChange).toBe(0);
  });
});
