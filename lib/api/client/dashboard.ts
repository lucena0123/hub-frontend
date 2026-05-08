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

export const getDashboardSparklines = async (): Promise<SparklineData> => {
  const { data } = await apiClient.get<SparklineData>('/api/dashboard/sparklines');
  return data;
};

