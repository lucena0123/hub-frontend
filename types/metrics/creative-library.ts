export type CreativeLibraryStatus = 'winner' | 'loser' | 'fatigued' | 'neutral';

export interface CreativeLibraryAdset {
  adsetId: string;
  adsetName: string | null;
}

export interface CreativeLibraryItem {
  snapshotId: string;
  creativeId: string | null;
  capturedAt: string | null;
  lastSeenAt: string | null;
  headline: string | null;
  primaryText: string | null;
  description: string | null;
  ctaType: string | null;
  destinationUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  format: string | null;
  isDynamic: boolean;
  headlines: unknown;
  primaryTexts: unknown;
  descriptions: unknown;
  ctaTypes: unknown;
  destinationUrls: unknown;
  campaigns: string[];
  adsets: CreativeLibraryAdset[];
  adsCount: number;
  metrics: {
    totalSpend: number;
    totalConversations: number;
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    avgCpm: number;
    cpl: number | null;
    video3sViewsTotal: number;
    videoThruplayTotal: number;
    hookRateAvg: number | null;
    holdRateAvg: number | null;
  };
  recent: {
    spend: number;
    conversations: number;
    cpl: number | null;
  };
  previous: {
    spend: number;
    conversations: number;
    cpl: number | null;
  };
  deltas: {
    conversationsPct: number | null;
    cplPct: number | null;
  };
  flags: {
    winner: boolean;
    loser: boolean;
    fatigued: boolean;
  };
  status: CreativeLibraryStatus;
  analysis?: {
    reasons: Array<{
      code: string;
      message: string;
      severity: 'info' | 'warning' | 'critical';
      thresholds?: Record<string, number>;
    }>;
  };
}

export interface CreativeLibraryInsights {
  medianCpl: number | null;
  topCtas: Array<{
    ctaType: string;
    conversations: number;
    spend: number;
    cpl: number | null;
  }>;
  topHeadlines: Array<{
    headline: string;
    conversations: number;
    spend: number;
    cpl: number | null;
  }>;
  counts: {
    winners: number;
    losers: number;
    fatigued: number;
  };
}

export interface CreativeLibraryResponse {
  clientId: string;
  period: { start: string; end: string };
  scope: { clientId?: string; campaignId?: string };
  total: number;
  creatives: CreativeLibraryItem[];
  insights: CreativeLibraryInsights;
}
