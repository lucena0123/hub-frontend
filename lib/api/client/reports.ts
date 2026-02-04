import type { MonthlyReport } from '@/types';

import { API_BASE_URL, apiClient } from './http';

export const generateReport = async (clientId: string, payload: { month: number; year: number }): Promise<MonthlyReport> => {
  const { data } = await apiClient.post<MonthlyReport>(`/api/reports/generate/${clientId}`, payload, { timeout: 0 });
  return data;
};

export const generateWeeklyReport = async (
  clientId: string,
  payload: { startDate: string; endDate: string }
): Promise<MonthlyReport> => {
  const { data } = await apiClient.post<MonthlyReport>(`/api/reports/generate-weekly/${clientId}`, payload, { timeout: 0 });
  return data;
};

export const getReportsHistory = async (clientId: string): Promise<MonthlyReport[]> => {
  const { data } = await apiClient.get<MonthlyReport[]>(`/api/reports/${clientId}/history`);
  return data;
};

export const getReportDownloadUrl = (reportId: string): string => {
  return `${API_BASE_URL}/api/reports/${reportId}/download`;
};

