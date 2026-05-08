import type { DashboardOverview, DashboardStats, SparklineData } from '@/types';

import { apiClient } from './http';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/api/dashboard/stats');
  return data;
};

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const { data } = await apiClient.get<DashboardOverview>('/api/dashboard/overview');
  return data;
};

// TODO: replace mock with real fetch when GET /api/dashboard/sparklines is deployed
export const getDashboardSparklines = async (): Promise<SparklineData> => {
  return {
    spend:   [420, 380, 510, 490, 620, 580, 640],
    roas:    [2.1, 2.3, 2.0, 2.4, 2.6, 2.5, 2.8],
    leads:   [18, 22, 19, 25, 28, 24, 30],
    clients: [22, 22, 23, 23, 24, 24, 24],
  };
};

