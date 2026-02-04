import type { AlertsResponse } from '@/types';

import { apiClient } from './http';

export const getAlerts = async (): Promise<AlertsResponse> => {
  const { data } = await apiClient.get<AlertsResponse>('/api/alerts');
  return data;
};

