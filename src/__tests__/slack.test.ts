import { encryptWebhookUrl, decryptWebhookUrl, sendSpikeAlert, sendWeeklySummary } from "@/lib/slack";

const ENCRYPTION_KEY = "a".repeat(64); // 64-char hex string for test

beforeEach(() => {
  process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Encryption / Decryption ────────────────────────────────────────────────

describe("encryptWebhookUrl / decryptWebhookUrl", () => {
  it("round-trips a webhook URL correctly", () => {
    const url = "https://hooks.slack.com/services/T000/B000/xxxx";
    const encrypted = encryptWebhookUrl(url);
    const decrypted = decryptWebhookUrl(encrypted);
    expect(decrypted).toBe(url);
  });

  it("produces ciphertext different from plaintext", () => {
    const url = "https://hooks.slack.com/services/T000/B000/xxxx";
    const encrypted = encryptWebhookUrl(url);
    expect(encrypted).not.toBe(url);
  });

  it("encrypting the same URL twice produces different ciphertexts (IV randomness)", () => {
    const url = "https://hooks.slack.com/services/T000/B000/xxxx";
    const enc1 = encryptWebhookUrl(url);
    const enc2 = encryptWebhookUrl(url);
    // CryptoJS AES uses a random salt per call
    expect(enc1).not.toBe(enc2);
    // But both decrypt to the same plaintext
    expect(decryptWebhookUrl(enc1)).toBe(url);
    expect(decryptWebhookUrl(enc2)).toBe(url);
  });

  it("round-trips a URL with special characters", () => {
    const url = "https://hooks.slack.com/services/T0A1+B2=C3&D4?e=5";
    const encrypted = encryptWebhookUrl(url);
    expect(decryptWebhookUrl(encrypted)).toBe(url);
  });
});

// ── sendSpikeAlert ─────────────────────────────────────────────────────────

describe("sendSpikeAlert", () => {
  const alert = {
    service: "Lambda",
    deltaUsd: 120.5,
    deltaPct: 312,
    dailyCost: 160.0,
    cause: "Infinite retry loop",
    fix: "Check CloudWatch logs for runaway Lambda invocations",
    accountAlias: "prod-main",
    dashboardUrl: "https://costguard.app/dashboard",
  };

  it("sends a POST request to the webhook URL", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendSpikeAlert("https://hooks.slack.com/test", alert);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://hooks.slack.com/test");
    expect(opts.method).toBe("POST");
  });

  it("sends JSON with correct Content-Type header", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendSpikeAlert("https://hooks.slack.com/test", alert);

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(() => JSON.parse(opts.body)).not.toThrow();
  });

  it("includes the service name in the Slack payload", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendSpikeAlert("https://hooks.slack.com/test", alert);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("Lambda");
  });

  it("includes deltaUsd in the Slack payload", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendSpikeAlert("https://hooks.slack.com/test", alert);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain("120");
  });

  it("throws when Slack returns a non-ok response", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 400 } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await expect(sendSpikeAlert("https://hooks.slack.com/test", alert)).rejects.toThrow(
      "Slack delivery failed: 400"
    );
  });

  it("propagates network errors", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(sendSpikeAlert("https://hooks.slack.com/test", alert)).rejects.toThrow(
      "Network error"
    );
  });
});

// ── sendWeeklySummary ──────────────────────────────────────────────────────

describe("sendWeeklySummary", () => {
  const summary = {
    accountAlias: "prod-main",
    weekStart: "2026-03-23",
    totalSpend: 4200.0,
    topService: "EC2",
    topServiceCost: 1800.0,
    spendVsLastWeek: 8.3,
    dashboardUrl: "https://costguard.app/dashboard",
  };

  it("sends a POST request to the webhook URL", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendWeeklySummary("https://hooks.slack.com/test", summary);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("https://hooks.slack.com/test");
  });

  it("includes account alias and total spend in the payload", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendWeeklySummary("https://hooks.slack.com/test", summary);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain("prod-main");
    expect(JSON.stringify(body)).toContain("4200");
  });

  it("shows 📈 for positive spend vs last week", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendWeeklySummary("https://hooks.slack.com/test", { ...summary, spendVsLastWeek: 5 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain("📈");
  });

  it("shows 📉 for negative spend vs last week", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global, "fetch").mockImplementation(mockFetch);

    await sendWeeklySummary("https://hooks.slack.com/test", { ...summary, spendVsLastWeek: -10 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain("📉");
  });
});
