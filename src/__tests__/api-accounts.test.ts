/**
 * Tests for /api/accounts GET and POST
 * All external dependencies (Clerk, Supabase, AWS) are mocked.
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

const mockGetCostExplorerClient = jest.fn();
const mockFetchDailyCosts = jest.fn();
jest.mock("@/lib/aws", () => ({
  getCostExplorerClient: mockGetCostExplorerClient,
  fetchDailyCosts: mockFetchDailyCosts,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { GET, POST } from "@/app/api/accounts/route";

function makeRequest(body?: object): Request {
  return new Request("http://localhost/api/accounts", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Chain builder for supabase `.from(...).select(...).eq(...).single()` */
function buildChain(result: { data?: any; error?: any }) {
  const chain: any = {};
  ["select", "eq", "insert", "upsert", "update", "delete", "in", "order", "limit", "single"].forEach(
    (m) => (chain[m] = jest.fn().mockReturnValue(chain))
  );
  chain.single = jest.fn().mockResolvedValue(result);
  chain.then = undefined; // not a promise itself
  return chain;
}

// ── GET /api/accounts ──────────────────────────────────────────────────────

describe("GET /api/accounts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValueOnce({ success: false });
    const res = await GET();
    expect(res.status).toBe(429);
  });

  it("returns 404 when user not found in DB", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });

    const userChain = buildChain({ data: null, error: null });
    mockSupabaseFrom.mockReturnValue(userChain);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns accounts array for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });

    const accounts = [{ id: "acc_1", account_alias: "prod", aws_account_id: "123456789012", status: "active", connected_at: "2026-01-01" }];

    // First call: users lookup
    const userChain = buildChain({ data: { id: "db_user_1" }, error: null });
    // Second call: accounts listing
    const accountsChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: accounts, error: null }),
    };
    mockSupabaseFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(accountsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].account_alias).toBe("prod");
  });

  it("returns empty array when user has no accounts", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });

    const userChain = buildChain({ data: { id: "db_user_1" }, error: null });
    const accountsChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabaseFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(accountsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });
});

// ── POST /api/accounts ─────────────────────────────────────────────────────

describe("POST /api/accounts", () => {
  const validBody = {
    roleArn: "arn:aws:iam::123456789012:role/CostGuardReadOnlyRole",
    awsAccountId: "123456789012",
    accountAlias: "prod-main",
    externalId: "ext-id-abc",
  };

  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValueOnce({ success: false });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  it("returns 400 on invalid body (missing fields)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });
    const res = await POST(makeRequest({ roleArn: "arn:aws:iam::123:role/Foo" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when AWS role assumption fails", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });
    mockGetCostExplorerClient.mockRejectedValue(new Error("AccessDenied"));

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Role not accessible");
  });

  it("returns 404 when user not found in DB after role verification", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });
    mockGetCostExplorerClient.mockResolvedValue({});
    mockFetchDailyCosts.mockResolvedValue([]);

    const userChain = buildChain({ data: null, error: null });
    mockSupabaseFrom.mockReturnValue(userChain);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it("returns 201 and new account on success", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });
    mockGetCostExplorerClient.mockResolvedValue({});
    mockFetchDailyCosts.mockResolvedValue([]);

    // users lookup
    const userChain = buildChain({ data: { id: "db_user_1" }, error: null });
    // insert chain
    const insertChain: any = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "acc_new", account_alias: "prod-main" },
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(insertChain);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe("active");
  });

  it("returns 400 when DB insert fails (duplicate account)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockLimit.mockResolvedValue({ success: true });
    mockGetCostExplorerClient.mockResolvedValue({});
    mockFetchDailyCosts.mockResolvedValue([]);

    const userChain = buildChain({ data: { id: "db_user_1" }, error: null });
    const insertChain: any = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "duplicate key" },
      }),
    };
    mockSupabaseFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(insertChain);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("already exist");
  });
});
