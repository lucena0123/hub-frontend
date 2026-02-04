import type { DailyMetric, PerformanceSummary } from './campaign';

export interface LeadGenMetrics extends DailyMetric {
  messagingConversations: number;
  messagingFirstReply: number;
  linkClicks: number;
  landingPageViews: number;
}

export interface LeadTrackingData {
  id: string;
  campaignId: string;
  date: string;
  qualifiedLeads: number;
  disqualificationReasons?: Record<string, number> | null;
  contractsClosed: number;
  averageTicket: number;
  revenueGenerated: number;
  leadsResponded: number;
  responseTimeHours: number | null;
  notes: string | null;
  leadQualificationRate: number | null;
  closingRate: number | null;
  roi: number | null;
  costPerContract: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadGenPerformanceSummary extends PerformanceSummary {
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
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

