/**
 * BPMN System - API Client
 */

import axios from 'axios';
import type {
  Client,
  Campaign,
  ProcessInstance,
  Task,
  DashboardStats,
  HealthStatus,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health Check
export const getHealth = async (): Promise<HealthStatus> => {
  const { data } = await apiClient.get<HealthStatus>('/health');
  return data;
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  const { data } = await apiClient.get<Client[]>('/api/clients');
  return data;
};

export const getClientById = async (id: string): Promise<Client> => {
  const { data } = await apiClient.get<Client>(`/api/clients/${id}`);
  return data;
};

type ClientPayload = {
  name: string;
  email: string;
  tier: string;
  budget: number;
  contractStart: string;
  contractEnd?: string | null;
  cpfCnpj?: string;
};

export const createClient = async (payload: ClientPayload): Promise<Client> => {
  const { name, email, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.post<Client>('/api/clients', {
    name,
    email,
    tier,
    budget,
    contractStart,
    contractEnd,
  });
  return response.data;
};

export const updateClient = async (id: string, payload: ClientPayload): Promise<Client> => {
  const { name, email, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.put<Client>(`/api/clients/${id}`, {
    name,
    email,
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

// Campaigns
export const getCampaigns = async (): Promise<Campaign[]> => {
  const { data } = await apiClient.get<Campaign[]>('/api/campaigns');
  return data;
};

// Processes
export const getProcesses = async (): Promise<ProcessInstance[]> => {
  const { data } = await apiClient.get<ProcessInstance[]>('/api/processes');
  return data;
};

export const getProcessById = async (id: string): Promise<ProcessInstance & { tasks: Task[] }> => {
  const { data } = await apiClient.get<ProcessInstance & { tasks: Task[] }>(`/api/processes/${id}`);
  return data;
};

// Tasks
export const getTasks = async (status?: string): Promise<Task[]> => {
  const params = status ? { status } : {};
  const { data } = await apiClient.get<Task[]>('/api/tasks', { params });
  return data;
};

// Dashboard Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/api/dashboard/stats');
  return data;
};

export default apiClient;
