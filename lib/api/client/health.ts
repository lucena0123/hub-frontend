import type { HealthStatus } from '@/types';

import { apiClient } from './http';

export const getHealth = async (): Promise<HealthStatus> => {
  const { data } = await apiClient.get<HealthStatus>('/health');
  return data;
};

