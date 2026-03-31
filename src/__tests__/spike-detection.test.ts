import { detectSpike, SpikeResult } from "@/lib/spike-detection";

describe("detectSpike", () => {
  // --- isSpike: true cases ---

  it("flags a spike when both delta % and delta $ exceed thresholds", () => {
    // avg = 100, today = 200 → +100% and +$100
    const result = detectSpike(200, [100, 100, 100, 100, 100, 100, 100]);
    expect(result.isSpike).toBe(true);
  });

  it("returns correct deltaPct and deltaUsd on a spike", () => {
    const result = detectSpike(200, [100, 100, 100, 100, 100, 100, 100]);
    expect(result.avg7d).toBeCloseTo(100);
    expect(result.deltaUsd).toBeCloseTo(100);
    expect(result.deltaPct).toBeCloseTo(100);
  });

  // --- isSpike: false — only one threshold met ---

  it("does NOT flag when delta% > 30 but deltaUsd <= 50 (small service noise)", () => {
    // avg = 10, today = 15 → +50% but only +$5
    const result = detectSpike(15, [10, 10, 10, 10, 10, 10, 10]);
    expect(result.isSpike).toBe(false);
    expect(result.deltaPct).toBeCloseTo(50);
    expect(result.deltaUsd).toBeCloseTo(5);
  });

  it("does NOT flag when deltaUsd > 50 but delta% <= 30 (big service small drift)", () => {
    // avg = 1000, today = 1060 → +$60 but only +6%
    const result = detectSpike(1060, [1000, 1000, 1000, 1000, 1000, 1000, 1000]);
    expect(result.isSpike).toBe(false);
    expect(result.deltaUsd).toBeCloseTo(60);
    expect(result.deltaPct).toBeCloseTo(6);
  });

  it("does NOT flag when cost is exactly at the thresholds (not strictly above)", () => {
    // avg = 100, today = 130 → exactly 30% and $30 — neither threshold strictly exceeded
    const result = detectSpike(130, [100, 100, 100, 100, 100, 100, 100]);
    expect(result.isSpike).toBe(false);
  });

  // --- Edge cases ---

  it("returns isSpike false and deltaPct 0 when avg is zero (no prior data)", () => {
    const result = detectSpike(200, [0, 0, 0, 0, 0, 0, 0]);
    expect(result.isSpike).toBe(false);
    expect(result.deltaPct).toBe(0);
    expect(result.avg7d).toBe(0);
  });

  it("handles an empty history array gracefully", () => {
    const result = detectSpike(200, []);
    expect(result.isSpike).toBe(false);
    expect(result.avg7d).toBe(0);
    expect(result.deltaPct).toBe(0);
  });

  it("handles todayCost of zero (cost dropped to nothing)", () => {
    const result = detectSpike(0, [100, 100, 100, 100, 100, 100, 100]);
    expect(result.isSpike).toBe(false);
    expect(result.deltaUsd).toBeCloseTo(-100);
    expect(result.deltaPct).toBeCloseTo(-100);
  });

  it("correctly averages an uneven 7-day history", () => {
    // avg = (10+20+30+40+50+60+70)/7 = 40
    const result = detectSpike(200, [10, 20, 30, 40, 50, 60, 70]);
    expect(result.avg7d).toBeCloseTo(40);
    expect(result.deltaUsd).toBeCloseTo(160);
    expect(result.deltaPct).toBeCloseTo(400);
    expect(result.isSpike).toBe(true);
  });

  it("handles partial history (fewer than 7 days)", () => {
    // avg = (100+200)/2 = 150, today = 300 → +100% and +$150
    const result = detectSpike(300, [100, 200]);
    expect(result.avg7d).toBeCloseTo(150);
    expect(result.isSpike).toBe(true);
  });

  it("returns exact threshold boundary — 31% and $51 should spike", () => {
    // avg ≈ 164.12, today = 164.12 * 1.31 ≈ 214.99  (deltaUsd ≈ 51)
    const avg = 164.12;
    const today = avg * 1.31;
    const result = detectSpike(today, Array(7).fill(avg));
    expect(result.isSpike).toBe(true);
  });
});
