export type OptimizationCenterSeverity = 'critical' | 'warning' | 'info' | 'opportunity';
export type OptimizationCenterCategory = 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
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
  level: 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
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
      promptId?: string;
      promptVersion: string;
    };
  };
  defaults: OptimizationCenterThemeTargets;
  themes: OptimizationCenterThemeConfig[];
  rules: OptimizationCenterRuleConfig[];
}

export interface CreativeCopyInsightsAnalysis {
  aiUsed?: boolean;
  message?: string | null;
  angle?: { name?: string | null; reason?: string | null } | null;
  persona?: string | null;
  hook?: string | null;
  clarityIssues?: string[];
  complianceRisks?: string[];
  suggestions?: {
    headlines?: string[];
    primaryTexts?: string[];
    ctas?: string[];
    experiments?: string[];
  } | null;
  [key: string]: unknown;
}

export interface CreativeCopyInsightsResponse {
  snapshotId: string;
  themeKey: string | null;
  themeName: string | null;
  status: 'success' | 'failed' | 'pending';
  model: string | null;
  promptId?: string | null;
  promptVersion: string | null;
  analysis: CreativeCopyInsightsAnalysis | null;
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
  entity?: { type: 'campaign' | 'creative' | 'adset'; id: string; name?: string | null };
  metrics?: Record<string, number | string | null>;
  thresholds?: Record<string, number | string | null>;
}

export interface OptimizationCenterHighlight {
  snapshotId: string;
  headline: string | null;
  ctaType: string | null;
  thumbnailUrl: string | null;
  adNames?: string[];
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
    matchedBy: 'tag' | 'keyword' | 'default' | 'manual';
    matchedValue: string | null;
    targets: OptimizationCenterThemeTargets;
  };
  budgetDiagnostics?: Array<{
    campaignId: string;
    campaignName: string;
    budgetMode: string;
    budgetSource: string;
    assumedBudgetKind: string;
    campaignBudget: number;
    adsetDailyBudget: number;
    adsetLifetimeBudget: number;
    expectedSpendLast7: number;
    minSpendForEvaluation: number;
  }>;
  summary: { total: number; critical: number; warning: number; info: number; opportunity: number };
  highlights: {
    winners: OptimizationCenterHighlight[];
    losers: OptimizationCenterHighlight[];
    fatigued: OptimizationCenterHighlight[];
  };
  items: OptimizationCenterItem[];
}
