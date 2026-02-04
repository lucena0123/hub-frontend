import type { Client } from '@/types';

import { apiClient } from './http';

export type ClientPayload = {
  name: string;
  email: string;
  cpfCnpj?: string;
  metaAdAccountId?: string;
  tier: string;
  budget: number;
  contractStart: string;
  contractEnd?: string | null;
};

export const getClients = async (): Promise<Client[]> => {
  const { data } = await apiClient.get<Client[]>('/api/clients');
  return data;
};

export const getClientById = async (id: string): Promise<Client> => {
  const { data } = await apiClient.get<Client>(`/api/clients/${id}`);
  return data;
};

export const createClient = async (payload: ClientPayload): Promise<Client> => {
  const { name, email, cpfCnpj, metaAdAccountId, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.post<Client>('/api/clients', {
    name,
    email,
    cpfCnpj,
    metaAdAccountId,
    tier,
    budget,
    contractStart,
    contractEnd,
  });
  return response.data;
};

export const updateClient = async (id: string, payload: ClientPayload): Promise<Client> => {
  const { name, email, cpfCnpj, metaAdAccountId, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.put<Client>(`/api/clients/${id}`, {
    name,
    email,
    cpfCnpj,
    metaAdAccountId,
    tier,
    budget,
    contractStart,
    contractEnd,
  });
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/clients/${id}`);
};

