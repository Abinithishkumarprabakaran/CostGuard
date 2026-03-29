import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getCostExplorerClient, fetchDailyCosts } from "@/lib/aws";
import { strictRateLimit } from "@/lib/rate-limit";

const verifySchema = z.object({
  roleArn: z.string(),
  externalId: z.string(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1"; 
  const { success } = await strictRateLimit.limit(`accounts-verify-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { roleArn, externalId } = parsed.data;

    try {
      const client = await getCostExplorerClient(roleArn, externalId);
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      await fetchDailyCosts(client, yesterday, today);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Role not accessible or missing permissions" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
