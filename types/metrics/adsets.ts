export interface AdSetMetric {
  adsetId: string;
  adsetName: string;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  avgCtr: number;
  avgCpc: number;
  avgCpm: number;
  avgFrequency: number;
  cpl: number;
  status?: string | null;
  effectiveStatus?: string | null;
  configuredStatus?: string | null;
  dailyBudget?: number | null;
  lifetimeBudget?: number | null;
  metadata?: {
    billingEvent?: string | null;
    optimizationGoal?: string | null;
    bidStrategy?: string | null;
    bidAmount?: string | null;
    bidCap?: string | null;
    costCap?: string | null;
    destinationType?: string | null;
    promotedObject?: Record<string, unknown> | null;
    attributionSpec?: Array<Record<string, unknown>> | null;
    targeting?: Record<string, unknown> | null;
    startTime?: string | null;
    endTime?: string | null;
    configuredStatus?: string | null;
  } | null;
}

export interface AdSetMetricsResponse {
  campaignId: string;
  total: number;
  adsets: AdSetMetric[];
}
