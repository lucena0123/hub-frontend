import type { BPMNProgress } from './bpmn';

export interface MetricsCampaign {
  id: string;
  clientId: string;
  name: string;
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok' | 'other';
  budget: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  objective?: string;
  targetAudience?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  id: string;
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;
  roas: number;
  leads: number;
  qualifiedLeads: number;
  revenue: number;
  platform: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpl: number;
  roas: number;
  messagingConversations?: number;
  messagingFirstReply?: number;
  linkClicks?: number;
  landingPageViews?: number;
}

export interface CampaignAd {
  id: string;
  campaignId: string;
  adName: string;
  adType: 'image' | 'video' | 'carousel' | 'text';
  status: 'active' | 'paused' | 'archived';
  headline?: string;
  description?: string;
  callToAction?: string;
  imageUrl?: string;
  videoUrl?: string;
  landingPageUrl?: string;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  avgCtr: number;
  avgCpc: number;
  platform: string;
  platformAdId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSummary {
  campaignId: string;
  campaignName: string;
  platform: string;
  objective?: string | null;
  objectiveMeta?: {
    optimizationGoal?: string | null;
    destinationType?: string | null;
    billingEvent?: string | null;
  } | null;
  leadsResponded?: number;
  avgResponseTimeHours?: number | null;
  optimizationThemeKey?: string | null;
  optimizationSubthemeKey?: string | null;
  period: {
    start: string;
    end: string;
  };
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalLeads: number;
  totalSpend: number;
  totalRevenue: number;
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalReach: number;
  avgFrequency: number;
  avgCpm: number;
  qualityRanking?: string | null;
  engagementRateRanking?: string | null;
  conversionRateRanking?: string | null;
  avgCtr: number;
  avgCpc: number;
  avgCpl: number;
  avgCpa: number;
  roas: number;
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUtilization: number;
  budgetMode?: 'abo' | 'cbo' | 'mixed' | 'unknown';
  budgetType?: 'daily' | 'lifetime' | 'adset_daily' | 'adset_lifetime' | 'unknown';
  budgetPeriod?: number;
  dailyMetrics: DailyMetric[];
  vsLastPeriod?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    roas: number;
  };
  goals?: {
    targetCpl?: number;
    targetRoas?: number;
    targetConversions?: number;
  };
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ClientPerformanceSummary {
  clientId: string;
  clientName: string;
  period: {
    start: string;
    end: string;
  };
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalLeads: number;
  totalSpend: number;
  totalRevenue: number;
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalReach: number;
  avgFrequency: number;
  avgCpm: number;
  avgCtr: number;
  avgCpl: number;
  avgRoas: number;
  campaigns: PerformanceSummary[];
  bpmnProgress?: BPMNProgress;
}

export type MetricsPeriod = '7d' | '14d' | '30d' | '60d' | '90d' | 'custom';

export interface MetricsQuery {
  period?: MetricsPeriod;
  startDate?: string;
  endDate?: string;
  platform?: string;
  campaignId?: string;
}
