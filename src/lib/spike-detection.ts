export interface SpikeResult {
  isSpike: boolean;
  deltaPct: number;
  deltaUsd: number;
  avg7d: number;
}

// Both conditions must be true to avoid noisy alerts on tiny services.
// 30% delta AND at least $50 absolute increase.
export function detectSpike(
  todayCost: number,
  last7DayCosts: number[]  // Most recent 7 days, oldest first
): SpikeResult {
  const sum = last7DayCosts.reduce((a, b) => a + b, 0);
  const avg7d = last7DayCosts.length > 0 ? sum / last7DayCosts.length : 0;
  const deltaUsd = todayCost - avg7d;
  const deltaPct = avg7d === 0 ? 0 : (deltaUsd / avg7d) * 100;
  const isSpike = deltaPct > 30 && deltaUsd > 50;

  return { isSpike, deltaPct, deltaUsd, avg7d };
}
