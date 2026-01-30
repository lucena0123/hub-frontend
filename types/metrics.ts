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
  period: {
    start: string;
    end: string;
  };
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  avgCtr: number;
  avgCpc: number;
  avgCpl: number;
  avgCpa: number;
  roas: number;
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUtilization: number;
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
  totalSpend: number;
  totalRevenue: number;
  avgCtr: number;
  avgCpl: number;
  avgRoas: number;
  campaigns: PerformanceSummary[];
  bpmnProgress?: BPMNProgress;
}

export interface BPMNProgress {
  id: string;
  clientId: string;
  currentSubprocess: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progressPercentage: number;
  completedTasks: string[];
  pendingTasks: string[];
  blockedTasks: string[];
  startedAt?: string;
  estimatedCompletion?: string;
  completedAt?: string;
  notes?: string;
  blockers?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
  }>;
  subprocessHistory?: Array<{
    subprocess: string;
    startedAt: string;
    completedAt: string;
    duration: number;
  }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  id: string;
  clientId: string;
  reportType: 'monthly' | 'quarterly' | 'custom';
  periodStart: string;
  periodEnd: string;
  title: string;
  summaryData: {
    performance: ClientPerformanceSummary;
    insights: string[];
    recommendations: string[];
    highlights: string[];
  };
  filePath?: string;
  fileSize?: number;
  pdfUrl?: string;
  generatedBy?: string;
  generatedAt: string;
  version: number;
  status: 'generating' | 'generated' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type MetricsPeriod = '7d' | '14d' | '30d' | '60d' | '90d' | 'custom';

export interface MetricsQuery {
  period?: MetricsPeriod;
  startDate?: string;
  endDate?: string;
  platform?: string;
  campaignId?: string;
}
