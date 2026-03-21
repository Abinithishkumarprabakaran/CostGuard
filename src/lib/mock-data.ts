export const costOverTimeData = [
  { date: "Feb 01", cost: 1240 },
  { date: "Feb 02", cost: 1255 },
  { date: "Feb 03", cost: 1230 },
  { date: "Feb 04", cost: 1260 },
  { date: "Feb 05", cost: 1280 },
  { date: "Feb 06", cost: 1300 },
  { date: "Feb 07", cost: 1450, anomaly: true }, // Spike
  { date: "Feb 08", cost: 1430 },
  { date: "Feb 09", cost: 1390 },
  { date: "Feb 10", cost: 1310 },
  { date: "Feb 11", cost: 1315 },
  { date: "Feb 12", cost: 1320 },
  { date: "Feb 13", cost: 1325 },
  { date: "Feb 14", cost: 1350 },
  { date: "Feb 15", cost: 1340 },
  { date: "Feb 16", cost: 1335 },
  { date: "Feb 17", cost: 1330 },
  { date: "Feb 18", cost: 1360 },
  { date: "Feb 19", cost: 1380 },
  { date: "Feb 20", cost: 1370 },
  { date: "Feb 21", cost: 1390 },
  { date: "Feb 22", cost: 1410 },
  { date: "Feb 23", cost: 1420 },
  { date: "Feb 24", cost: 1400 },
  { date: "Feb 25", cost: 1650, anomaly: true }, // Spike
  { date: "Feb 26", cost: 1680 },
  { date: "Feb 27", cost: 1690 },
]

export const spendByServiceData = [
  { name: "EC2", value: 12450, color: "#5B6CFF" },
  { name: "RDS", value: 8320, color: "#7C8CFF" },
  { name: "S3", value: 4100, color: "#22C55E" },
  { name: "Lambda", value: 2450, color: "#F59E0B" },
  { name: "CloudFront", value: 1800, color: "#EF4444" },
  { name: "Other", value: 950, color: "#E6E8F0" },
]

export const topCostDrivers = [
  { service: "EC2 Instances", cost: "$415.00", percent: "42%", trend: "+5.2%" },
  { service: "RDS Provisioned", cost: "$278.40", percent: "28%", trend: "+1.1%" },
  { service: "S3 Standard", cost: "$136.60", percent: "14%", trend: "-0.5%" },
  { service: "Lambda Requests", cost: "$81.60", percent: "8%", trend: "+12.4%" },
]

export const activeAnomalies = [
  {
    service: "Lambda",
    account: "Prod-Main (8472...)",
    increase: "$450 (+312%)",
    cause: "Unintended infinite retry loop in processOrder function",
    severity: "Critical",
    status: "Active"
  },
  {
    service: "EC2",
    account: "Dev-Sandbox (1190...)",
    increase: "$120 (+45%)",
    cause: "3 m5.4xlarge instances left running overnight",
    severity: "Warning",
    status: "Active"
  },
]

export const optimizationOpportunities = [
  {
    title: "Orphaned EBS Volumes",
    description: "12 unattached volumes can be deleted.",
    savings: "$340/mo",
    effort: "Low",
    risk: "Low"
  },
  {
    title: "Right-size RDS Instances",
    description: "production-db-1 is over-provisioned.",
    savings: "$890/mo",
    effort: "Medium",
    risk: "Medium"
  }
]
