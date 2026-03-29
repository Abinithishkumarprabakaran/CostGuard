import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";

// Assumes a customer's IAM role and returns a temporary Cost Explorer client.
// Credentials are NEVER stored — only used in memory for the duration of the request.
export async function getCostExplorerClient(
  roleArn: string,
  externalId: string
): Promise<CostExplorerClient> {
  const sts = new STSClient({ region: process.env.AWS_REGION ?? "ap-south-1" });

  const { Credentials } = await sts.send(
    new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: "CostGuardSession",
      ExternalId: externalId,
      DurationSeconds: 3600,
    })
  );

  if (!Credentials) throw new Error("Failed to assume IAM role");

  return new CostExplorerClient({
    region: "us-east-1", // Cost Explorer API is always us-east-1
    credentials: {
      accessKeyId: Credentials.AccessKeyId!,
      secretAccessKey: Credentials.SecretAccessKey!,
      sessionToken: Credentials.SessionToken,
    },
  });
}

// Fetches daily cost grouped by SERVICE for a given date range.
export async function fetchDailyCosts(
  client: CostExplorerClient,
  startDate: string, // "YYYY-MM-DD"
  endDate: string    // "YYYY-MM-DD" (exclusive — use tomorrow for today's data)
) {
  const response = await client.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: "DAILY",
      Metrics: ["BlendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    })
  );
  return response.ResultsByTime ?? [];
}
