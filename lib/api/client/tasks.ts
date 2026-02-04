import type { Task } from '@/types';

import { apiClient } from './http';

export const getTasks = async (status?: string): Promise<Task[]> => {
  const params = status ? { status } : {};
  const { data } = await apiClient.get<Task[]>('/api/tasks', { params });
  return data;
};

