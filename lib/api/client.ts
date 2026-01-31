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
  DashboardOverview,
  AlertsResponse,
  HealthStatus,
  DailyMetric,
  PerformanceSummary,
  ClientPerformanceSummary,
  BPMNProgress,
  MetricsPeriod,
  MonthlyReport,
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
  cpfCnpj?: string;
  tier: string;
  budget: number;
  contractStart: string;
  contractEnd?: string | null;
};

export const createClient = async (payload: ClientPayload): Promise<Client> => {
  const { name, email, cpfCnpj, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.post<Client>('/api/clients', {
    name,
    email,
    cpfCnpj,
    tier,
    budget,
    contractStart,
    contractEnd,
  });
  return response.data;
};

export const updateClient = async (id: string, payload: ClientPayload): Promise<Client> => {
  const { name, email, cpfCnpj, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.put<Client>(`/api/clients/${id}`, {
    name,
    email,
    cpfCnpj,
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

export const getCampaignMetrics = async (
  campaignId: string,
  period?: MetricsPeriod
): Promise<DailyMetric[]> => {
  const { data } = await apiClient.get<DailyMetric[]>(
    `/api/campaigns/${campaignId}/metrics`,
    { params: period ? { period } : undefined }
  );
  return data;
};

export const getCampaignPerformanceSummary = async (
  campaignId: string
): Promise<PerformanceSummary> => {
  const { data } = await apiClient.get<PerformanceSummary>(
    `/api/campaigns/${campaignId}/performance-summary`
  );
  return data;
};

export const getClientPerformanceSummary = async (
  clientId: string
): Promise<ClientPerformanceSummary> => {
  const { data } = await apiClient.get<ClientPerformanceSummary>(
    `/api/clients/${clientId}/performance-summary`
  );
  return data;
};

export const getClientBpmnProgress = async (
  clientId: string
): Promise<BPMNProgress> => {
  const { data } = await apiClient.get<BPMNProgress>(
    `/api/clients/${clientId}/bpmn-progress`
  );
  return data;
};

export const updateClientBpmnProgress = async (
  clientId: string,
  payload: Partial<BPMNProgress>
): Promise<BPMNProgress> => {
  const { data } = await apiClient.put<BPMNProgress>(
    `/api/clients/${clientId}/bpmn-progress`,
    payload
  );
  return data;
};

export const initializeBpmnProgress = async (
  clientId: string,
  payload: { startingSubprocess?: string }
): Promise<BPMNProgress> => {
  const { data } = await apiClient.post<BPMNProgress>(
    `/api/clients/${clientId}/bpmn-progress`,
    payload
  );
  return data;
};

export const getBpmnSubprocessClients = async (
  subprocessId: string
): Promise<BPMNProgress[]> => {
  const { data } = await apiClient.get<BPMNProgress[]>(
    `/api/bpmn/subprocess/${subprocessId}/clients`
  );
  return data;
};

export const getPerformanceSummary = async (campaignId: string): Promise<PerformanceSummary> => {
  return getCampaignPerformanceSummary(campaignId);
};

export const getClientPerformance = async (
  clientId: string
): Promise<ClientPerformanceSummary> => {
  return getClientPerformanceSummary(clientId);
};

export const getBPMNProgress = async (clientId: string): Promise<BPMNProgress> => {
  return getClientBpmnProgress(clientId);
};

export const updateBPMNProgress = async (
  clientId: string,
  updates: Partial<BPMNProgress>
): Promise<BPMNProgress> => {
  return updateClientBpmnProgress(clientId, updates);
};

export const generateReport = async (
  clientId: string,
  payload: { month: number; year: number }
): Promise<MonthlyReport> => {
  const { data } = await apiClient.post<MonthlyReport>(
    `/api/reports/generate/${clientId}`,
    payload
  );
  return data;
};

export const getReportsHistory = async (clientId: string): Promise<MonthlyReport[]> => {
  const { data } = await apiClient.get<MonthlyReport[]>(
    `/api/reports/${clientId}/history`
  );
  return data;
};

export const getReportDownloadUrl = (reportId: string): string => {
  return `${API_BASE_URL}/api/reports/${reportId}/download`;
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

// Dashboard Overview + Alerts
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const { data } = await apiClient.get<DashboardOverview>('/api/dashboard/overview');
  return data;
};

export const getAlerts = async (): Promise<AlertsResponse> => {
  const { data } = await apiClient.get<AlertsResponse>('/api/alerts');
  return data;
};

export default apiClient;
