import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`accounts-gen-ext-id-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Generate a cryptographically random UUID as the external ID
  const externalId = crypto.randomUUID();
  return NextResponse.json({ externalId }, { status: 200 });
}
