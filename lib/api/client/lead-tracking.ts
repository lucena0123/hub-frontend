import type { LeadTrackingData } from '@/types';

import { apiClient } from './http';

export type UpsertLeadTrackingPayload = {
  campaignId: string;
  date: string;
  qualifiedLeads?: number;
  disqualificationReasons?: Record<string, number>;
  contractsClosed?: number;
  averageTicket?: number;
  revenueGenerated?: number;
  leadsResponded?: number;
  responseTimeHours?: number | null;
  notes?: string | null;
};

export const upsertLeadTracking = async (
  payload: UpsertLeadTrackingPayload
): Promise<LeadTrackingData> => {
  const { data } = await apiClient.post<LeadTrackingData>('/api/lead-tracking', payload);
  return data;
};

export const getLeadTracking = async (
  campaignId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<LeadTrackingData[]> => {
  const { data } = await apiClient.get<LeadTrackingData[]>(`/api/campaigns/${campaignId}/lead-tracking`, { params: options });
  return data;
};

export const getLeadSummary = async (
  campaignId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalQualifiedLeads: number;
  totalContractsClosed: number;
  totalRevenue: number;
  avgQualificationRate: number;
  avgClosingRate: number;
  avgROI: number;
  avgCostPerContract: number;
}> => {
  const { data } = await apiClient.get(`/api/campaigns/${campaignId}/lead-summary`, { params: { startDate, endDate } });
  return data;
};

export const deleteLeadTracking = async (campaignId: string, date: string): Promise<void> => {
  await apiClient.delete(`/api/campaigns/${campaignId}/lead-tracking`, { params: { date } });
};
