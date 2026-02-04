import type { ProcessInstance, Task } from '@/types';

import { apiClient } from './http';

export const getProcesses = async (): Promise<ProcessInstance[]> => {
  const { data } = await apiClient.get<ProcessInstance[]>('/api/processes');
  return data;
};

export const getProcessById = async (id: string): Promise<ProcessInstance & { tasks: Task[] }> => {
  const { data } = await apiClient.get<ProcessInstance & { tasks: Task[] }>(`/api/processes/${id}`);
  return data;
};

