import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const dummyLimiter = {
  limit: async (identifier: string) => ({ success: true, pending: Promise.resolve() })
} as any;

let redis: Redis | undefined;
let apiRateLimitObj = dummyLimiter;
let strictRateLimitObj = dummyLimiter;

if (hasRedis) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    apiRateLimitObj = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
    });

    strictRateLimitObj = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
    });
  } catch (err) {
    console.error("Failed to initialize Redis rate limiter:", err);
  }
}

// 20 requests per 10 seconds per IP for general API routes
export const apiRateLimit = apiRateLimitObj;

// 5 requests per minute for expensive operations (AWS verify, Slack test)
export const strictRateLimit = strictRateLimitObj;
