import CryptoJS from "crypto-js";

// Encrypt a Slack webhook URL before storing in DB
export function encryptWebhookUrl(url: string): string {
  return CryptoJS.AES.encrypt(url, process.env.ENCRYPTION_KEY!).toString();
}

// Decrypt when reading from DB to send a message
export function decryptWebhookUrl(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, process.env.ENCRYPTION_KEY!);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Send a spike alert to Slack
export async function sendSpikeAlert(webhookUrl: string, alert: {
  service: string;
  deltaUsd: number;
  deltaPct: number;
  dailyCost: number;
  cause: string;
  fix: string;
  accountAlias: string;
  dashboardUrl: string;
}) {
  const payload = {
    text: `🚨 Cost Spike: ${alert.service} (+$${alert.deltaUsd.toFixed(0)})`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `🚨 Cost Spike: ${alert.service}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Account:*\n${alert.accountAlias}` },
          { type: "mrkdwn", text: `*Service:*\n${alert.service}` },
          { type: "mrkdwn", text: `*Today's Cost:*\n$${alert.dailyCost.toFixed(2)}` },
          { type: "mrkdwn", text: `*Increase:*\n+$${alert.deltaUsd.toFixed(2)} (+${alert.deltaPct.toFixed(1)}%)` },
        ],
      },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: `*🔍 Why this happened:*\n${alert.cause}` } },
      { type: "section", text: { type: "mrkdwn", text: `*🔧 How to fix it:*\n${alert.fix}` } },
      {
        type: "actions",
        elements: [{
          type: "button",
          text: { type: "plain_text", text: "View in Dashboard", emoji: true },
          url: alert.dashboardUrl,
          style: "primary",
        }],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Slack delivery failed: ${res.status}`);
}

// Send weekly cost summary
export async function sendWeeklySummary(webhookUrl: string, summary: {
  accountAlias: string;
  weekStart: string;
  totalSpend: number;
  topService: string;
  topServiceCost: number;
  spendVsLastWeek: number;
  dashboardUrl: string;
}) {
  const direction = summary.spendVsLastWeek >= 0 ? "📈" : "📉";
  const payload = {
    text: `📊 Weekly AWS Cost Summary — ${summary.accountAlias}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `📊 Weekly AWS Cost Summary`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Account:*\n${summary.accountAlias}` },
          { type: "mrkdwn", text: `*Week of:*\n${summary.weekStart}` },
          { type: "mrkdwn", text: `*Total Spend:*\n$${summary.totalSpend.toFixed(2)}` },
          { type: "mrkdwn", text: `*vs Last Week:*\n${direction} ${summary.spendVsLastWeek >= 0 ? "+" : ""}${summary.spendVsLastWeek.toFixed(1)}%` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Top Service:* ${summary.topService} — $${summary.topServiceCost.toFixed(2)}` },
      },
      {
        type: "actions",
        elements: [{
          type: "button",
          text: { type: "plain_text", text: "View Full Report", emoji: true },
          url: summary.dashboardUrl,
        }],
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
