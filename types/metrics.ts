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

export interface AdSetMetric {
  adsetId: string;
  adsetName: string;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
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

export interface BreakdownSegment {
  label: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  ctr: number;
  cpm: number;
  shareOfSpend: number;
}

export interface BreakdownResponse {
  campaignId: string;
  breakdownType: string;
  total: number;
  segments: BreakdownSegment[];
}

export interface TemporalDayOfWeekData {
  dayOfWeek: number;
  dayName: string;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalConversations: number;
  avgCtr: number;
  avgCpm: number;
  cpl: number;
  daysCount: number;
}

export interface TemporalAnalysisResponse {
  campaignId: string;
  byDayOfWeek: TemporalDayOfWeekData[];
  bestDay: string | null;
  worstDay: string | null;
  cheapestDay: string | null;
  mostExpensiveDay: string | null;
}

export interface BusinessMetricsData {
  totalSpend: number;
  totalConversations: number;
  totalContracts: number;
  totalRevenue: number;
  avgTicket: number;
  cac: number;
  costPerLead: number;
  conversionRate: number;
  ltv: number;
  ltvCacRatio: number;
  ltvCacHealth: string;
  roi: number;
  config: {
    lifetimeMonths: number;
    monthlyRevenue: number;
  };
}

export interface BusinessMetricsResponse extends BusinessMetricsData {
  campaignId: string;
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
  disqualificationReasons?: Record<string, number> | null; // Why leads were not qualified (manual)
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

export type OptimizationCenterSeverity = 'critical' | 'warning' | 'info' | 'opportunity';
export type OptimizationCenterCategory = 'campaign' | 'creative' | 'qualification' | 'data';
export type OptimizationCenterAction = 'review' | 'pause' | 'refresh' | 'scale' | 'track' | 'sync';

export interface OptimizationCenterThemeTargets {
  minSpendForEvaluation: number;
  minContactsForEvaluation: number;
  copyHeadlineMinChars: number;
  copyHeadlineMaxChars: number;
  copyPrimaryTextMaxChars: number;
  targetCplGoodMax: number;
  targetCplOkMax: number;
  targetCplBadMin: number;
  cplRisePctWarning: number;
  contactsDropPctWarning: number;
  frequencyWarning: number;
  frequencyCritical: number;
  firstReplyRateMin: number;
  qualificationRateTargetMin: number;
  creativeMinSpendWinner: number;
  creativeMinSpendLoser: number;
  creativeWinnerPercentile: number;
  creativeWinnerMaxCount: number;
  creativeLoserCplMultiplier: number;
  creativeLoserMaxConversations: number;
  creativeFatigueDropPct: number;
  creativeFatigueCplMultiplier: number;
  creativeFatigueMinPrevConversations: number;
  creativeFatigueMinSpend: number;
  hookRateMin: number;
  holdRateMin: number;
}

export interface OptimizationCenterThemeConfig {
  key: string;
  name: string;
  description: string;
  tags: string[];
  keywords: string[];
  targets?: Partial<OptimizationCenterThemeTargets>;
}

export interface OptimizationCenterRuleConfig {
  id: string;
  level: 'campaign' | 'creative' | 'qualification' | 'data';
  severity: OptimizationCenterSeverity;
  category: OptimizationCenterCategory;
  action: OptimizationCenterAction;
  title: string;
  description: string;
  condition: string;
}

export interface OptimizationCenterPlaybook {
  key: 'optimization-center';
  version: string;
  updatedAt: string;
  description: string;
  copy?: {
    preferredCtaTypes: string[];
    prohibitedPhrases: string[];
    notes?: string;
  };
  ai?: {
    copySuggestions?: {
      enabled: boolean;
      requiresEnv: 'OPENAI_API_KEY';
      model: string;
      promptVersion: string;
    };
  };
  defaults: OptimizationCenterThemeTargets;
  themes: OptimizationCenterThemeConfig[];
  rules: OptimizationCenterRuleConfig[];
}

export interface CreativeCopyInsightsResponse {
  snapshotId: string;
  themeKey: string | null;
  themeName: string | null;
  status: 'success' | 'failed' | 'pending';
  model: string | null;
  promptVersion: string | null;
  analysis: any | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OptimizationCenterItem {
  id: string;
  ruleId?: string;
  severity: OptimizationCenterSeverity;
  category: OptimizationCenterCategory;
  action: OptimizationCenterAction;
  title: string;
  description: string;
  theme?: { key: string; name: string; matchedBy: string; matchedValue: string | null };
  entity?: { type: 'campaign' | 'creative'; id: string; name?: string | null };
  metrics?: Record<string, number | string | null>;
  thresholds?: Record<string, number | string | null>;
}

export interface OptimizationCenterHighlight {
  snapshotId: string;
  headline: string | null;
  ctaType: string | null;
  thumbnailUrl: string | null;
  isDynamic: boolean;
  spend: number;
  conversations: number;
  cpl: number | null;
}

export interface OptimizationCenterResponse {
  clientId: string;
  period: { start: string; end: string };
  scope: { clientId?: string; campaignId?: string };
  generatedAt: string;
  playbookVersion: string;
  theme?: {
    themeKey: string;
    themeName: string;
    matchedBy: 'tag' | 'keyword' | 'default';
    matchedValue: string | null;
    targets: OptimizationCenterThemeTargets;
  };
  summary: { total: number; critical: number; warning: number; info: number; opportunity: number };
  highlights: {
    winners: OptimizationCenterHighlight[];
    losers: OptimizationCenterHighlight[];
    fatigued: OptimizationCenterHighlight[];
  };
  items: OptimizationCenterItem[];
}
