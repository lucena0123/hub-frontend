/**
 * BPMN System - Frontend Types
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  metaAdAccountId?: string | null;
  businessNicheKey?: string | null;
  defaultChannelKey?: string | null;
  tier: 'basic' | 'premium' | 'enterprise' | 'standard';
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'churned';
  budget: number;
  contractStart: string;
  contractEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  budget: number;
  status: 'planning' | 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  platform?: 'meta' | 'google' | 'linkedin' | 'tiktok' | 'other';
  externalId?: string;
  objective?: string;
  objectiveClassKey?: 'messages' | 'lead' | 'conversion' | 'traffic' | 'awareness' | null;
  channelClassKey?: string | null;
  ruleProfileId?: string | null;
  optimizationThemeKey?: string | null;
  optimizationSubthemeKey?: string | null;
  targetAudience?: string;
  spent?: number;
  createdAt?: string;
  updatedAt?: string;
  clientName?: string;
  clientTier?: string;
}

export interface ProcessInstance {
  id: string;
  processId: string;
  clientId: string;
  clientName?: string;
  campaignId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'suspended' | 'paused';
  priority: number;
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
  currentPhase?: string;
  currentTask?: string;
  progress?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}



export interface OptimizationActionPayload {
  type: 'pause_ad' | 'resume_ad' | 'set_adset_budget' | 'set_campaign_budget';
  entityId: string;
  amount?: number;
  reason: string;
}

export interface Task {
  id: string;
  taskId: string; // Business ID (e.g., opt_123)
  processInstanceId: string;
  name: string; // Was taskName, backend sends 'name'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'suspended';
  lane?: string;
  priority: number;
  input?: {
    uniqueKey?: string;
    insightId?: string;
    description?: string;
    severity?: string;
    entityName?: string;
    autoAction?: OptimizationActionPayload;
    [key: string]: unknown;
  };
  startedAt: string;
  completedAt?: string;
  processInstance?: {
    processId: string;
    client?: {
      name: string;
      id?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  clientName?: string;
}

export interface KpiDelta {
  value: number;
  pct: number;
}

export interface SparklineData {
  spend: number[];
  roas: number[];
  leads: number[];
  clients: number[];
}

export interface DashboardOverview {
  clients: {
    total: number;
    active: number;
    byTier: Record<string, number>;
  };
  campaigns: {
    total: number;
    active: number;
    byPlatform: Record<string, number>;
  };
  performance: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    totalLeads: number;
    avgRoas: number;
    avgCtr: number;
    avgCpl: number;
    delta?: {
      totalSpend: KpiDelta;
      avgRoas: KpiDelta;
      avgCpl: KpiDelta;
      avgCtr: KpiDelta;
      totalConversions: KpiDelta;
      totalLeads: KpiDelta;
    };
  };
  bpmn: {
    clientsInExecution: number;
    clientsInMonitoring: number;
    avgProgress: number;
    blockedClients: number;
  };
  reports: {
    totalGenerated: number;
    lastGenerated: string | null;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  runningProcesses: number;
  pendingTasks: number;
  completedTasksToday: number;
  timestamp: string;
}

export interface PerformanceAlert {
  id: string;
  clientId: string;
  clientName: string;
  campaignId?: string;
  campaignName?: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  createdAt: string;
  analysisWindow?: string;
  learningWindow?: string;
  learningWindowBasis?: 'since_start' | 'since_reset' | 'mixed' | 'unknown';
}

export interface AlertsResponse {
  total: number;
  critical: number;
  warning: number;
  alerts: PerformanceAlert[];
}

export type ZeroConversationsSeverity = 'critical' | 'warning' | 'info';

export type ZeroConversationsCause = {
  code: string;
  title: string;
  description: string;
  action: string;
  severity: ZeroConversationsSeverity;
};

export type ZeroConversationsDiagnostic = {
  clientId: string;
  entity: { type: 'campaign' | 'adset'; id: string; name: string | null };
  period: { start: string; end: string };
  metrics: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    linkClicks: number;
    landingPageViews: number;
    conversations: number;
    leads: number;
    conversions: number;
  };
  objective?: string | null;
  status?: string | null;
  adsetStatusSummary?: {
    total: number;
    active: number;
    paused: number;
    disapproved: number;
    withIssues: number;
    pendingReview: number;
  };
  causes: ZeroConversationsCause[];
  eligible: boolean;
  generatedAt: string;
};

export type AbTestSuggestionCategory = 'hook' | 'cta' | 'format' | 'visual';
export type AbTestTargetMetric = 'conversations' | 'ctr' | 'cpl' | 'hook_rate' | 'hold_rate';

export type AbTestSuggestion = {
  id: string;
  category: AbTestSuggestionCategory;
  title: string;
  hypothesis: string;
  targetMetric: AbTestTargetMetric;
};

export type AbTestSuggestionsResponse = {
  snapshotId: string;
  clientId: string | null;
  period: { start: string; end: string };
  suggestions: AbTestSuggestion[];
  model: string | null;
  promptId: string | null;
  promptVersion: string | null;
  cached: boolean;
  createdAt: string | null;
};

export type BenchmarkInsight = {
  code: 'cpl_above_p75' | 'ctr_below_p25' | 'within_baseline';
  message: string;
  metric: 'cpl' | 'ctr';
  currentValue: number;
  baselineValue: number | null;
};

export type CampaignBenchmark = {
  campaignId: string;
  campaignName: string;
  themeKey: string;
  metrics: { cpl: number | null; ctr: number | null };
  baseline: { cplMedian: number | null; cplP75: number | null; ctrMedian: number | null; ctrP25: number | null };
  insights: BenchmarkInsight[];
};

export type CampaignBenchmarksResponse = {
  clientId: string;
  period: { start: string; end: string };
  baselinePeriod: { start: string; end: string };
  campaigns: CampaignBenchmark[];
};

export type CreativeBenchmarkResponse = {
  snapshotId: string;
  clientId: string;
  themeKey: string;
  period: { start: string; end: string };
  baselinePeriod: { start: string; end: string };
  metrics: { cpl: number | null; ctr: number | null };
  baseline: { cplMedian: number | null; cplP75: number | null; ctrMedian: number | null; ctrP25: number | null };
  insights: BenchmarkInsight[];
};

export type ComplianceRiskSeverity = 'low' | 'warning' | 'critical';

export type ComplianceRiskCreative = {
  snapshotId: string;
  headline: string | null;
  ctaType: string | null;
  score: number;
  severity: ComplianceRiskSeverity;
  issues: Array<{
    ruleId: string;
    severity: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    suggestion?: string;
  }>;
  campaignIds: string[];
};

export type ComplianceRiskCampaign = {
  campaignId: string;
  total: number;
  critical: number;
  warning: number;
  low: number;
};

export type ComplianceRiskResponse = {
  clientId: string;
  period: { start: string; end: string };
  creatives: ComplianceRiskCreative[];
  campaigns: ComplianceRiskCampaign[];
  summary: { total: number; critical: number; warning: number; low: number };
};

export type AiInsightsResponse = {
  entity: { type: 'campaign' | 'creative'; id: string; name?: string | null };
  period: { start: string; end: string };
  summary: string;
  recommendations: string[];
  confidence: number;
  cached: boolean;
  createdAt: string | null;
};

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
  environment: string;
  version: string;
  error?: string;
}

export * from './metrics';
