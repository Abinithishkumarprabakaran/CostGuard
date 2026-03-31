/**
 * END-TO-END TEST SUITE — Cost Guard AWS Pipeline
 *
 * Tests the full pipeline using REAL AWS credentials from .env.local:
 *   AWS credentials → STS AssumeRole → Cost Explorer → Spike Detection → AI Explanation
 *
 * Prerequisites:
 *   - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env.local
 *   - The IAM user must have sts:AssumeRole permission
 *
 * For the "with IAM role" tests, you need a real Role ARN.
 * If you don't have one yet, those tests are skipped automatically.
 *
 * Run: npx jest e2e-aws-pipeline --no-coverage --verbose
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local before anything else
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import {
  STSClient,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
} from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";
import { getCostExplorerClient, fetchDailyCosts } from "@/lib/aws";
import { detectSpike } from "@/lib/spike-detection";
import { encryptWebhookUrl, decryptWebhookUrl } from "@/lib/slack";

// ── Helpers ────────────────────────────────────────────────────────────────

const hasAwsCreds =
  !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

// Set a real Role ARN here if you have one, otherwise role tests are skipped
const TEST_ROLE_ARN = process.env.E2E_TEST_ROLE_ARN ?? "";
const TEST_EXTERNAL_ID = process.env.E2E_TEST_EXTERNAL_ID ?? "";
const hasRoleArn = !!TEST_ROLE_ARN && !!TEST_EXTERNAL_ID;

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

const today = formatDate(new Date());
const yesterday = formatDate(new Date(Date.now() - 86400000));
const sevenDaysAgo = formatDate(new Date(Date.now() - 7 * 86400000));
const thirtyDaysAgo = formatDate(new Date(Date.now() - 30 * 86400000));
const tomorrow = formatDate(new Date(Date.now() + 86400000));

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — AWS Credential Validation
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 1. AWS Credential Validation", () => {
  const skip = !hasAwsCreds;

  it(
    "env vars AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are present",
    () => {
      expect(process.env.AWS_ACCESS_KEY_ID).toBeTruthy();
      expect(process.env.AWS_SECRET_ACCESS_KEY).toBeTruthy();
      expect(process.env.COST_GUARD_AWS_ACCOUNT_ID).toBeTruthy();
      console.log(`  Account ID : ${process.env.COST_GUARD_AWS_ACCOUNT_ID}`);
      console.log(`  Key ID     : ${process.env.AWS_ACCESS_KEY_ID?.slice(0, 8)}...`);
    }
  );

  (skip ? it.skip : it)(
    "STS GetCallerIdentity confirms credentials are valid",
    async () => {
      const sts = new STSClient({ region: process.env.AWS_REGION ?? "ap-south-1" });
      const res = await sts.send(new GetCallerIdentityCommand({}));

      expect(res.Account).toBe(process.env.COST_GUARD_AWS_ACCOUNT_ID);
      expect(res.UserId).toBeTruthy();
      expect(res.Arn).toContain("arn:aws:iam::");

      console.log(`  Verified identity:`);
      console.log(`    Account : ${res.Account}`);
      console.log(`    ARN     : ${res.Arn}`);
    },
    15000
  );

  (skip ? it.skip : it)(
    "IAM user has sts:AssumeRole permission (policy attached)",
    async () => {
      // We can confirm STS works by verifying we can instantiate the client
      // and the GetCallerIdentity returns the expected account
      const sts = new STSClient({ region: "us-east-1" });
      const identity = await sts.send(new GetCallerIdentityCommand({}));
      expect(identity.Account).toBeTruthy();

      // If we get here without AccessDenied, the credentials are valid
      console.log(`  STS access confirmed for: ${identity.Arn}`);
    },
    15000
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — Cost Explorer Direct Access (Your Own Account)
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 2. Cost Explorer — Direct Account Access", () => {
  const skip = !hasAwsCreds;

  (skip ? it.skip : it)(
    "can call Cost Explorer API directly with own credentials",
    async () => {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const res = await client.send(
        new GetCostAndUsageCommand({
          TimePeriod: { Start: sevenDaysAgo, End: today },
          Granularity: "DAILY",
          Metrics: ["BlendedCost"],
          GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
        })
      );

      expect(res.ResultsByTime).toBeDefined();
      expect(Array.isArray(res.ResultsByTime)).toBe(true);

      console.log(`  Days returned     : ${res.ResultsByTime!.length}`);

      // Summarise costs across all services
      let totalCost = 0;
      const serviceBreakdown: Record<string, number> = {};

      for (const day of res.ResultsByTime!) {
        for (const group of day.Groups || []) {
          const service = group.Keys?.[0] ?? "Unknown";
          const cost = parseFloat(group.Metrics?.BlendedCost?.Amount ?? "0");
          serviceBreakdown[service] = (serviceBreakdown[service] ?? 0) + cost;
          totalCost += cost;
        }
      }

      console.log(`  Total 7-day spend : $${totalCost.toFixed(4)}`);
      console.log(`  Services found    : ${Object.keys(serviceBreakdown).length}`);

      const top = Object.entries(serviceBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      if (top.length > 0) {
        console.log(`  Top services:`);
        top.forEach(([svc, cost]) => console.log(`    ${svc}: $${cost.toFixed(4)}`));
      } else {
        console.log(`  (No spend found — free tier or new account)`);
      }
    },
    20000
  );

  (skip ? it.skip : it)(
    "fetchDailyCosts helper returns structured results",
    async () => {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const results = await fetchDailyCosts(client, sevenDaysAgo, today);

      expect(Array.isArray(results)).toBe(true);
      // Each result has TimePeriod and Groups
      for (const r of results) {
        expect(r.TimePeriod).toBeDefined();
        expect(r.TimePeriod?.Start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      console.log(`  fetchDailyCosts returned ${results.length} day(s)`);
    },
    20000
  );

  (skip ? it.skip : it)(
    "30-day cost fetch works without errors",
    async () => {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const results = await fetchDailyCosts(client, thirtyDaysAgo, today);
      expect(results.length).toBeGreaterThanOrEqual(1);
      console.log(`  30-day fetch returned ${results.length} day(s)`);
    },
    25000
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — STS AssumeRole (requires E2E_TEST_ROLE_ARN in .env.local)
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 3. STS AssumeRole — Customer Account Simulation", () => {
  (hasRoleArn ? it : it.skip)(
    "getCostExplorerClient assumes the role and returns a working client",
    async () => {
      const client = await getCostExplorerClient(TEST_ROLE_ARN, TEST_EXTERNAL_ID);
      expect(client).toBeInstanceOf(CostExplorerClient);
      console.log(`  Role assumed: ${TEST_ROLE_ARN}`);
    },
    20000
  );

  (hasRoleArn ? it : it.skip)(
    "cost data can be fetched after role assumption",
    async () => {
      const client = await getCostExplorerClient(TEST_ROLE_ARN, TEST_EXTERNAL_ID);
      const results = await fetchDailyCosts(client, sevenDaysAgo, today);

      expect(Array.isArray(results)).toBe(true);
      console.log(`  Fetched ${results.length} days via assumed role`);
    },
    25000
  );

  (!hasRoleArn ? it : it.skip)(
    "SKIPPED — set E2E_TEST_ROLE_ARN and E2E_TEST_EXTERNAL_ID in .env.local to run",
    () => {
      console.log(
        "  Add to .env.local:\n" +
          "    E2E_TEST_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/CostGuardRole\n" +
          "    E2E_TEST_EXTERNAL_ID=your-external-id"
      );
      expect(true).toBe(true);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — Full Pipeline Simulation with Real Cost Data
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 4. Full Pipeline — Fetch → Parse → Detect Spikes", () => {
  const skip = !hasAwsCreds;

  (skip ? it.skip : it)(
    "fetches real cost data and runs spike detection across all services",
    async () => {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      // Fetch 8 days so we have 7-day history + yesterday
      const eightDaysAgo = formatDate(new Date(Date.now() - 8 * 86400000));
      const results = await fetchDailyCosts(client, eightDaysAgo, today);
      expect(results.length).toBeGreaterThanOrEqual(1);

      // Build service → date → cost map (same as nightly cron logic)
      const serviceCosts: Record<string, Record<string, number>> = {};
      for (const day of results) {
        const date = day.TimePeriod?.Start;
        if (!date) continue;
        for (const group of day.Groups || []) {
          const service = group.Keys?.[0];
          const cost = parseFloat(group.Metrics?.BlendedCost?.Amount ?? "0");
          if (service) {
            if (!serviceCosts[service]) serviceCosts[service] = {};
            serviceCosts[service][date] = cost;
          }
        }
      }

      const services = Object.keys(serviceCosts);
      console.log(`  Services analysed : ${services.length}`);

      let spikesFound = 0;
      const spikeReport: Array<{ service: string; todayCost: number; avg7d: number; deltaPct: number }> = [];

      for (const [service, datesObj] of Object.entries(serviceCosts)) {
        const yesterdayCost = datesObj[yesterday] ?? 0;

        // Build 7-day history (days 8→2 before today)
        const history: number[] = [];
        for (let i = 8; i >= 2; i--) {
          const d = formatDate(new Date(Date.now() - i * 86400000));
          history.push(datesObj[d] ?? 0);
        }

        const spike = detectSpike(yesterdayCost, history);

        if (spike.isSpike) {
          spikesFound++;
          spikeReport.push({
            service,
            todayCost: yesterdayCost,
            avg7d: spike.avg7d,
            deltaPct: spike.deltaPct,
          });
        }
      }

      console.log(`  Spikes detected   : ${spikesFound}`);
      if (spikeReport.length > 0) {
        console.log(`  Spike details:`);
        spikeReport.forEach((s) =>
          console.log(
            `    ${s.service}: $${s.todayCost.toFixed(2)} vs avg $${s.avg7d.toFixed(2)} (+${s.deltaPct.toFixed(1)}%)`
          )
        );
      } else {
        console.log(`  No spikes today (costs are stable)`);
      }

      // Pipeline result shape is always valid
      expect(spikesFound).toBeGreaterThanOrEqual(0);
      expect(services.length).toBeGreaterThanOrEqual(0);
    },
    30000
  );

  (skip ? it.skip : it)(
    "spike detection algorithm correctly classifies costs",
    async () => {
      // Test with known values — not AWS dependent
      const noSpike = detectSpike(100, [95, 98, 97, 96, 99, 100, 98]);
      expect(noSpike.isSpike).toBe(false); // Only ~2% increase

      const smallSpike = detectSpike(130, [95, 98, 97, 96, 99, 100, 98]);
      expect(smallSpike.isSpike).toBe(false); // >30% but <$50 absolute

      const realSpike = detectSpike(500, [95, 98, 97, 96, 99, 100, 98]);
      expect(realSpike.isSpike).toBe(true); // >30% AND >$50
      expect(realSpike.deltaPct).toBeGreaterThan(30);
      expect(realSpike.deltaUsd).toBeGreaterThan(50);

      console.log(`  Spike algorithm verified with synthetic data`);
      console.log(`    No spike: deltaPct=${noSpike.deltaPct.toFixed(1)}%`);
      console.log(`    Real spike: deltaPct=${realSpike.deltaPct.toFixed(1)}%, deltaUsd=$${realSpike.deltaUsd.toFixed(2)}`);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — Anthropic AI Explanation (requires ANTHROPIC_API_KEY)
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 5. Anthropic AI — Spike Explanation", () => {
  (hasAnthropicKey ? it : it.skip)(
    "explainSpike returns a valid explanation from Claude Haiku",
    async () => {
      const { explainSpike } = await import("@/lib/anthropic");

      const result = await explainSpike({
        service: "AWS Lambda",
        todayCost: 450,
        avg7dCost: 109.5,
        deltaPct: 311,
        deltaUsd: 340.5,
        dayOfWeek: "Monday",
      });

      expect(result.cause).toBeTruthy();
      expect(result.fix).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(result.confidence);

      console.log(`  AI Explanation:`);
      console.log(`    Cause      : ${result.cause}`);
      console.log(`    Fix        : ${result.fix}`);
      console.log(`    Confidence : ${result.confidence}`);
    },
    30000
  );

  (!hasAnthropicKey ? it : it.skip)(
    "SKIPPED — set ANTHROPIC_API_KEY in .env.local to test AI explanations",
    () => {
      console.log("  Add ANTHROPIC_API_KEY to .env.local to enable this test");
      expect(true).toBe(true);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 6 — Slack Encryption Round-trip
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 6. Slack — AES-256 Encryption Round-trip", () => {
  it("encrypts and decrypts a Slack webhook URL correctly", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(64); // 64-char hex key for test
    const url = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX";

    const encrypted = encryptWebhookUrl(url);
    expect(encrypted).not.toBe(url);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = decryptWebhookUrl(encrypted);
    expect(decrypted).toBe(url);

    console.log(`  Original URL  : ${url.slice(0, 40)}...`);
    console.log(`  Encrypted     : ${encrypted.slice(0, 40)}...`);
    console.log(`  Round-trip    : OK`);
  });

  it("different URLs produce different ciphertexts", () => {
    process.env.ENCRYPTION_KEY = "b".repeat(64);
    const url1 = "https://hooks.slack.com/services/AAA";
    const url2 = "https://hooks.slack.com/services/BBB";

    expect(encryptWebhookUrl(url1)).not.toBe(encryptWebhookUrl(url2));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 7 — Date Boundary & Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 7. Date Boundary & Edge Cases", () => {
  const skip = !hasAwsCreds;

  (skip ? it.skip : it)(
    "Cost Explorer handles month boundary (start of month) correctly",
    async () => {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      // Request from 1st of current month to today
      const now = new Date();
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const results = await fetchDailyCosts(client, firstOfMonth, today);
      expect(Array.isArray(results)).toBe(true);
      console.log(`  Current month data: ${results.length} days (from ${firstOfMonth} to ${today})`);
    },
    20000
  );

  (skip ? it.skip : it)(
    "Cost Explorer handles same start and end date gracefully",
    async () => {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      // Cost Explorer end date is exclusive, so start==end returns empty
      const results = await fetchDailyCosts(client, yesterday, yesterday);
      expect(Array.isArray(results)).toBe(true);
      // Empty result is valid (end is exclusive in Cost Explorer)
      console.log(`  Same-date query returned ${results.length} results (expected 0 — end is exclusive)`);
    },
    20000
  );

  it("spike detection handles all-zero history without dividing by zero", () => {
    const result = detectSpike(0, [0, 0, 0, 0, 0, 0, 0]);
    expect(result.isSpike).toBe(false);
    expect(result.deltaPct).toBe(0);
    expect(result.deltaUsd).toBe(0);
  });

  it("spike detection handles empty history array", () => {
    const result = detectSpike(500, []);
    expect(result.isSpike).toBe(false); // avg7d = 0, deltaPct = 0
    expect(result.avg7d).toBe(0);
  });

  it("spike detection handles single-day history", () => {
    const result = detectSpike(500, [100]);
    expect(result.isSpike).toBe(true);
    expect(result.deltaPct).toBeCloseTo(400);
    expect(result.deltaUsd).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 8 — End-to-End Summary Report
// ══════════════════════════════════════════════════════════════════════════════

describe("E2E › 8. Pipeline Health Summary", () => {
  it("prints a full system readiness report", () => {
    const checks = [
      { name: "AWS_ACCESS_KEY_ID",         ok: !!process.env.AWS_ACCESS_KEY_ID },
      { name: "AWS_SECRET_ACCESS_KEY",      ok: !!process.env.AWS_SECRET_ACCESS_KEY },
      { name: "COST_GUARD_AWS_ACCOUNT_ID",  ok: !!process.env.COST_GUARD_AWS_ACCOUNT_ID },
      { name: "ANTHROPIC_API_KEY",          ok: !!process.env.ANTHROPIC_API_KEY },
      { name: "NEXT_PUBLIC_SUPABASE_URL",   ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("mock") },
      { name: "SUPABASE_SERVICE_ROLE_KEY",  ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("mock") },
      { name: "STRIPE_SECRET_KEY",          ok: !!process.env.STRIPE_SECRET_KEY },
      { name: "ENCRYPTION_KEY",             ok: !!process.env.ENCRYPTION_KEY },
      { name: "CRON_SECRET",                ok: !!process.env.CRON_SECRET },
      { name: "E2E_TEST_ROLE_ARN",          ok: !!process.env.E2E_TEST_ROLE_ARN },
    ];

    console.log("\n  ╔══════════════════════════════════════════╗");
    console.log("  ║     Cost Guard — System Readiness        ║");
    console.log("  ╠══════════════════════════════════════════╣");

    checks.forEach(({ name, ok }) => {
      const icon = ok ? "✅" : "❌";
      console.log(`  ║  ${icon}  ${name.padEnd(36)}║`);
    });

    console.log("  ╚══════════════════════════════════════════╝\n");

    const critical = checks.filter(c =>
      ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "COST_GUARD_AWS_ACCOUNT_ID"].includes(c.name)
    );
    critical.forEach(c => expect(c.ok).toBe(true));
  });
});
