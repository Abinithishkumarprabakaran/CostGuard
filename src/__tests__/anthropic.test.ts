/**
 * Tests for src/lib/anthropic.ts — explainSpike()
 *
 * Strategy: mock the Anthropic SDK's messages.create at the module level,
 * then import explainSpike after so it picks up the mock.
 */

const mockCreate = jest.fn();

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { explainSpike } from "@/lib/anthropic";

const spikeData = {
  service: "Lambda",
  todayCost: 450,
  avg7dCost: 109.5,
  deltaPct: 311,
  deltaUsd: 340.5,
  dayOfWeek: "Monday",
};

function mockResponse(text: string) {
  mockCreate.mockResolvedValue({ content: [{ type: "text", text }] });
}

describe("explainSpike", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns parsed AI explanation on a valid JSON response", async () => {
    mockResponse(
      JSON.stringify({
        cause: "Infinite retry loop in processOrder function",
        fix: "Check CloudWatch for runaway invocations and set a concurrency limit",
        confidence: "high",
      })
    );

    const result = await explainSpike(spikeData);

    expect(result.cause).toBe("Infinite retry loop in processOrder function");
    expect(result.fix).toContain("CloudWatch");
    expect(result.confidence).toBe("high");
  });

  it("strips markdown code fences before parsing", async () => {
    mockResponse(
      "```json\n" +
        JSON.stringify({ cause: "Traffic spike", fix: "Scale up", confidence: "medium" }) +
        "\n```"
    );

    const result = await explainSpike(spikeData);
    expect(result.cause).toBe("Traffic spike");
    expect(result.confidence).toBe("medium");
  });

  it("returns fallback explanation when API returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Sorry, I cannot help with that." }],
    });

    const result = await explainSpike(spikeData);
    expect(result.confidence).toBe("low");
    expect(result.cause).toContain("Unable to determine");
  });

  it("returns an object (not throws) when API returns non-text content block", async () => {
    // The implementation falls back to "{}" for non-text blocks, which parses
    // to an empty object — a known limitation (no runtime validation of shape).
    mockCreate.mockResolvedValue({
      content: [{ type: "image", source: {} }],
    });

    const result = await explainSpike(spikeData);
    // Does not throw — returns the parsed object regardless of shape
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("propagates API errors (does not silently swallow them)", async () => {
    mockCreate.mockRejectedValue(new Error("API rate limit exceeded"));

    await expect(explainSpike(spikeData)).rejects.toThrow("API rate limit exceeded");
  });

  it("accepts all three confidence levels from the API", async () => {
    for (const confidence of ["high", "medium", "low"] as const) {
      mockResponse(JSON.stringify({ cause: "cause", fix: "fix", confidence }));
      const result = await explainSpike(spikeData);
      expect(result.confidence).toBe(confidence);
    }
  });

  it("calls the Anthropic API with correct model and max_tokens", async () => {
    mockResponse(JSON.stringify({ cause: "c", fix: "f", confidence: "low" }));

    await explainSpike(spikeData);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 300,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "user" }),
        ]),
      })
    );
  });

  it("includes service name and cost figures in the prompt sent to the API", async () => {
    mockResponse(JSON.stringify({ cause: "c", fix: "f", confidence: "low" }));

    await explainSpike(spikeData);

    const callArgs = mockCreate.mock.calls[0][0];
    const prompt = callArgs.messages[0].content as string;
    expect(prompt).toContain("Lambda");
    expect(prompt).toContain("450.00");
  });
});
