import { apiClient } from './http';

export type MetaGovernanceIssueStatus = 'open' | 'auto_fixed' | 'needs_review' | 'failed' | 'resolved';

export type MetaGovernanceIssueType =
  | 'missing_created_time'
  | 'date_mismatch'
  | 'non_canonical_name'
  | 'override_applied'
  | 'permission_error'
  | 'scope_mismatch'
  | 'meta_write_failed'
  | 'db_write_failed'
  | 'verify_mismatch';

export type MetaGovernanceSummary = {
  audited: number;
  compliant: number;
  autoFixed: number;
  needsReview: number;
  failed: number;
  resolvedDuringRun: number;
  createdTimeBackfilled: number;
  dryRun: boolean;
};

export type MetaGovernanceIssue = {
  id: string;
  syncId: string;
  clientId: string;
  accountId?: string | null;
  entityType: 'campaign' | 'adset' | 'ad';
  entityExternalId: string;
  campaignId?: string | null;
  issueType: MetaGovernanceIssueType;
  status: MetaGovernanceIssueStatus;
  currentName?: string | null;
  expectedName?: string | null;
  currentCreatedTime?: string | null;
  expectedCreatedTime?: string | null;
  beforePayload?: Record<string, unknown> | null;
  afterPayload?: Record<string, unknown> | null;
  metaError?: string | null;
  dbError?: string | null;
  details?: Record<string, unknown> | null;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  resolvedAt?: string | null;
  autoFixed?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MetaGovernanceIssuesResponse = {
  items: MetaGovernanceIssue[];
  total: number;
};

export const listMetaGovernanceIssues = async (params?: {
  clientId?: string;
  syncId?: string;
  status?: MetaGovernanceIssueStatus | string;
  entityType?: 'campaign' | 'adset' | 'ad' | string;
  issueType?: MetaGovernanceIssueType | string;
  limit?: number;
  offset?: number;
}): Promise<MetaGovernanceIssuesResponse> => {
  const { data } = await apiClient.get<MetaGovernanceIssuesResponse>('/api/meta-governance/issues', {
    params,
  });
  return data;
};

export const getMetaGovernanceIssue = async (id: string): Promise<MetaGovernanceIssue> => {
  const { data } = await apiClient.get<MetaGovernanceIssue>(`/api/meta-governance/issues/${id}`);
  return data;
};
