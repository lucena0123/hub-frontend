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
}

export interface AdSetMetricsResponse {
  campaignId: string;
  total: number;
  adsets: AdSetMetric[];
}
