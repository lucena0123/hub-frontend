import type {
  ActionHistoryResponse,
  ActionProposalDetailsResponse,
  ActionProposalExecutionsResponse,
  ApproveActionProposalResponse,
  ExecuteActionProposalResponse,
  GenerateActionProposalsResponse,
  ListActionProposalsResponse,
  RejectActionProposalResponse,
} from '@/types';

import { apiClient } from './http';

export type ListActionProposalsParams = {
  status?: string;
  action?: string;
  entityType?: string;
  limit?: number;
};

export const listActionProposals = async (
  clientId: string,
  params?: ListActionProposalsParams
): Promise<ListActionProposalsResponse> => {
  const { data } = await apiClient.get<ListActionProposalsResponse>(`/api/clients/${clientId}/action-proposals`, params ? { params } : undefined);
  return data;
};

export const getActionProposal = async (proposalId: string): Promise<ActionProposalDetailsResponse> => {
  const { data } = await apiClient.get<ActionProposalDetailsResponse>(`/api/action-proposals/${proposalId}`);
  return data;
};

export type GenerateActionProposalsInput = {
  period?: string;
  startDate?: string;
  endDate?: string;
  campaignId?: string;
  actions?: string[];
};

export const generateActionProposals = async (
  clientId: string,
  payload?: GenerateActionProposalsInput
): Promise<GenerateActionProposalsResponse> => {
  const { data } = await apiClient.post<GenerateActionProposalsResponse>(`/api/clients/${clientId}/action-proposals/generate`, payload ?? {});
  return data;
};

export const approveActionProposal = async (proposalId: string, payload?: { reason?: string }): Promise<ApproveActionProposalResponse> => {
  const { data } = await apiClient.post<ApproveActionProposalResponse>(`/api/action-proposals/${proposalId}/approve`, payload ?? {});
  return data;
};

export const rejectActionProposal = async (proposalId: string, payload?: { reason?: string }): Promise<RejectActionProposalResponse> => {
  const { data } = await apiClient.post<RejectActionProposalResponse>(`/api/action-proposals/${proposalId}/reject`, payload ?? {});
  return data;
};

export const executeActionProposal = async (proposalId: string, payload?: { dryRun?: boolean }): Promise<ExecuteActionProposalResponse> => {
  const { data } = await apiClient.post<ExecuteActionProposalResponse>(`/api/action-proposals/${proposalId}/execute`, payload ?? {});
  return data;
};

export const getActionProposalExecutions = async (proposalId: string): Promise<ActionProposalExecutionsResponse> => {
  const { data } = await apiClient.get<ActionProposalExecutionsResponse>(`/api/action-proposals/${proposalId}/executions`);
  return data;
};

export type ListActionHistoryParams = {
  status?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export const getActionHistory = async (
  clientId: string,
  params?: ListActionHistoryParams
): Promise<ActionHistoryResponse> => {
  const { data } = await apiClient.get<ActionHistoryResponse>(
    `/api/clients/${clientId}/action-history`,
    params ? { params } : undefined
  );
  return data;
};
