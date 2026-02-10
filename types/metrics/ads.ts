export interface AdCreativeSnapshot {
  snapshotId: string;
  creativeId: string | null;
  capturedAt: string | null;
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
  ctaTypes: unknown;
  destinationUrls: unknown;
  visualAttributes?: {
    dominantColor?: string | null;
    textDetected?: boolean | null;
    edgeDensity?: number | null;
    textDensity?: number | null;
    contrastRatio?: number | null;
    contrastLevel?: 'low' | 'medium' | 'high' | null;
    faceDetected?: boolean | null;
    objectDetected?: boolean | null;
    visualStyle?: 'text-heavy' | 'image-first' | 'mixed' | null;
    width?: number | null;
    height?: number | null;
    sampledAt?: string | null;
    algorithm?: { version?: string | null; notes?: string | null } | null;
  } | null;
}

export interface AdCreativeMetric {
  adId: string;
  adName: string;
  adsetId: string;
  creativeId?: string | null;
  creativeSnapshotId?: string | null;
  creative?: AdCreativeSnapshot | null;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  avgCtr: number;
  avgCpm: number;
  cpl: number;
  videoThruplay: number;
  video3secViews: number;
  videoP25: number;
  videoP50: number;
  videoP75: number;
  videoP100: number;
  hookRate: number;
  holdRate: number;
}

export interface AdMetricsResponse {
  campaignId: string;
  total: number;
  ads: AdCreativeMetric[];
}
