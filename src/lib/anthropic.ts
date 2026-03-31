import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface SpikeExplanation {
  cause: string;
  fix: string;
  confidence: "high" | "medium" | "low";
}

export async function explainSpike(data: {
  service: string;
  todayCost: number;
  avg7dCost: number;
  deltaPct: number;
  deltaUsd: number;
  dayOfWeek: string;
}): Promise<SpikeExplanation> {
  const prompt = `AWS Cost Spike Detected.

Service: ${data.service}
Today's Cost: $${data.todayCost.toFixed(2)}
7-Day Rolling Average: $${data.avg7dCost.toFixed(2)}
Increase: $${data.deltaUsd.toFixed(2)} (+${data.deltaPct.toFixed(1)}%)
Day of Week: ${data.dayOfWeek}

Respond ONLY with valid JSON in this exact format (no preamble, no markdown):
{
  "cause": "One sentence explaining the most likely root cause",
  "fix": "One concrete action the team should take right now",
  "confidence": "high"
}`;

  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system:
      "You are an AWS cloud cost optimization expert. Respond only in valid JSON. Be specific. Use plain English. No jargon.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as SpikeExplanation;
  } catch {
    return {
      cause: "Unable to determine root cause automatically.",
      fix: "Review AWS Cost Explorer for this service and check for recent deployments or traffic spikes.",
      confidence: "low",
    };
  }
}
