/**
 * Tests for POST /api/slack and DELETE /api/slack
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

const mockSendSpikeAlert = jest.fn();
const mockEncryptWebhookUrl = jest.fn((url: string) => `encrypted:${url}`);
jest.mock("@/lib/slack", () => ({
  sendSpikeAlert: mockSendSpikeAlert,
  encryptWebhookUrl: mockEncryptWebhookUrl,
  decryptWebhookUrl: jest.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────

import { POST, DELETE } from "@/app/api/slack/route";

function makeReq(method: string, body?: object): Request {
  return new Request("http://localhost/api/slack", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validBody = {
  webhookUrl: "https://hooks.slack.com/services/T000/B000/xxxx",
  channelName: "#alerts",
  teamName: "Acme",
};

// ── POST /api/slack ────────────────────────────────────────────────────────

describe("POST /api/slack", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeReq("POST", validBody));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockLimit.mockResolvedValueOnce({ success: false });
    const res = await POST(makeReq("POST", validBody));
    expect(res.status).toBe(429);
  });

  it("returns 400 on invalid body (missing channelName)", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    const res = await POST(makeReq("POST", { webhookUrl: "https://hooks.slack.com/x" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when webhook URL is not a valid URL", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    const res = await POST(makeReq("POST", { webhookUrl: "not-a-url", channelName: "#test" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when Slack rejects the test message", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockSendSpikeAlert.mockRejectedValue(new Error("Slack delivery failed: 400"));

    const res = await POST(makeReq("POST", validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid webhook URL");
  });

  it("returns 404 when user not found in DB", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockSendSpikeAlert.mockResolvedValue(undefined);

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    };
    mockSupabaseFrom.mockReturnValue(userChain);

    const res = await POST(makeReq("POST", validBody));
    expect(res.status).toBe(404);
  });

  it("returns 201 and saves encrypted webhook on success", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockSendSpikeAlert.mockResolvedValue(undefined);

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const upsertChain: any = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(upsertChain);

    const res = await POST(makeReq("POST", validBody));
    expect(res.status).toBe(201);
    expect(mockEncryptWebhookUrl).toHaveBeenCalledWith(validBody.webhookUrl);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 500 when DB upsert fails", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockSendSpikeAlert.mockResolvedValue(undefined);

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const upsertChain: any = {
      upsert: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(upsertChain);

    const res = await POST(makeReq("POST", validBody));
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/slack ──────────────────────────────────────────────────────

describe("DELETE /api/slack", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful delete", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const deleteChain: any = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(deleteChain);

    const res = await DELETE();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 500 when DB delete fails", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });

    const userChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "db_u1" } }),
    };
    const deleteChain: any = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: "constraint error" } }),
    };
    mockSupabaseFrom
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(deleteChain);

    const res = await DELETE();
    expect(res.status).toBe(500);
  });
});
