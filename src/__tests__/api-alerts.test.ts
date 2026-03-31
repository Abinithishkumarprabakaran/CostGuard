/**
 * Tests for /api/alerts GET and /api/alerts/[id]/resolve PATCH
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

import { GET } from "@/app/api/alerts/route";
import { PATCH } from "@/app/api/alerts/[id]/resolve/route";

function makeReq(url: string, method = "GET", body?: object): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── GET /api/alerts ────────────────────────────────────────────────────────

describe("GET /api/alerts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(makeReq("http://localhost/api/alerts"));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockLimit.mockResolvedValueOnce({ success: false });
    const res = await GET(makeReq("http://localhost/api/alerts"));
    expect(res.status).toBe(429);
  });

  it("returns 404 when user not in DB", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    };
    mockSupabaseFrom.mockReturnValue(userChain);
    const res = await GET(makeReq("http://localhost/api/alerts"));
    expect(res.status).toBe(404);
  });

  it("returns empty array when user has no AWS accounts", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const accountsChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [] }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(accountsChain);

    const res = await GET(makeReq("http://localhost/api/alerts"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns all alerts with no status filter", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const accountsChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ id: "acc1" }] }),
    };
    const alerts = [
      { id: "alert1", service: "Lambda", resolved: false },
      { id: "alert2", service: "EC2", resolved: true },
    ];
    const alertsChain: any = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: alerts }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(accountsChain)
      .mockReturnValueOnce(alertsChain);

    const res = await GET(makeReq("http://localhost/api/alerts?status=all"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(2);
  });

  it("applies 'open' filter — only unresolved alerts", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const accountsChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ id: "acc1" }] }),
    };
    const alertsChain: any = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ id: "alert1", resolved: false }] }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(accountsChain)
      .mockReturnValueOnce(alertsChain);

    const res = await GET(makeReq("http://localhost/api/alerts?status=open"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].resolved).toBe(false);
  });
});

// ── PATCH /api/alerts/[id]/resolve ─────────────────────────────────────────

describe("PATCH /api/alerts/[id]/resolve", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await PATCH(
      makeReq("http://localhost/api/alerts/alert1/resolve", "PATCH"),
      { params: Promise.resolve({ id: "alert1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 and marks alert as resolved", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });

    // 1. users lookup
    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    // 2. aws_accounts ownership lookup
    const accountsChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ id: "acc1" }] }),
    };
    // 3. spike_alerts select to verify ownership
    const alertSelectChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { account_id: "acc1" } }),
    };
    // 4. spike_alerts update
    const updateChain: any = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(accountsChain)
      .mockReturnValueOnce(alertSelectChain)
      .mockReturnValueOnce(updateChain);

    const res = await PATCH(
      makeReq("http://localhost/api/alerts/alert1/resolve", "PATCH"),
      { params: Promise.resolve({ id: "alert1" }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
