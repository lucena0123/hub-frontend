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
  // Lead Generation fields (optional for backward compatibility)
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
  period: {
    start: string;
    end: string;
  };
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  // Lead Generation Metrics
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  // Campaign Health Metrics
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
  // Lead Generation Metrics (aggregated)
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  // Campaign Health Metrics (aggregated)
  totalReach: number;
  avgFrequency: number;
  avgCpm: number;
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
  reportType: 'monthly' | 'weekly' | 'quarterly' | 'custom';
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

// Lead Generation Metrics (for service businesses like law firms)
export interface LeadGenMetrics extends DailyMetric {
  messagingConversations: number; // Conversations started (WhatsApp/Messenger)
  messagingFirstReply: number; // Leads that replied
  linkClicks: number; // Link clicks
  landingPageViews: number; // Landing page views
}

export interface LeadTrackingData {
  id: string;
  campaignId: string;
  date: string;
  // Manual input fields
  qualifiedLeads: number; // Leads with real potential
  contractsClosed: number; // Contracts closed
  averageTicket: number; // Average contract value
  revenueGenerated: number; // Total revenue from closed contracts
  leadsResponded: number; // Leads that responded to first message
  responseTimeHours: number | null; // Average response time
  notes: string | null; // Additional observations
  // Calculated fields
  leadQualificationRate: number | null; // % of leads that are qualified
  closingRate: number | null; // % of qualified leads that close
  roi: number | null; // ROI based on revenue vs spend
  costPerContract: number | null; // Spend / contracts closed
  createdAt: string;
  updatedAt: string;
}

export interface LeadGenPerformanceSummary extends PerformanceSummary {
  // Additional lead gen specific metrics
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  // Manual tracking data
  leadTracking?: {
    totalQualifiedLeads: number;
    totalContractsClosed: number;
    totalRevenue: number;
    avgQualificationRate: number;
    avgClosingRate: number;
    avgROI: number;
    avgCostPerContract: number;
  };
}
