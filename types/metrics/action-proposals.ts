export type ActionProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
export type ActionProposalDecision = 'approved' | 'rejected';
export type ActionExecutionStatus = 'queued' | 'running' | 'success' | 'failed';

export interface ActionProposal {
  proposalId: string;
  clientId: string;
  platform: string;
  accountId: string | null;
  source: string;
  sourceItemId: string | null;
  ruleId: string | null;
  playbookVersion: string | null;
  severity: string | null;
  category: string | null;
  action: string | null;
  title: string | null;
  description: string | null;
  entity: { type: string; id: string } | null;
  recommendedPayload: Record<string, unknown> | null;
  status: ActionProposalStatus;
  createdBy: { type: 'system' | 'user' | string; userId: string | null };
  createdAt: string;
  updatedAt: string;
  lastDecision: {
    decision: ActionProposalDecision;
    reason: string | null;
    decidedByUserId: string | null;
    decidedAt: string | null;
  } | null;
}

export interface ActionApproval {
  approvalId: string;
  proposalId: string;
  decision: ActionProposalDecision;
  reason: string | null;
  decidedByUserId: string;
  decidedAt: string;
  createdAt: string;
}

export interface ActionExecution {
  executionId: string;
  proposalId: string;
  status: ActionExecutionStatus;
  attempts: number;
  idempotencyKey: string | null;
  dryRun: boolean;
  requestPayload: Record<string, unknown> | null;
  metaResponse: Record<string, unknown> | null;
  error: { message: string; stack: string | null } | null;
  startedAt: string | null;
  completedAt: string | null;
  executedBy: { type: 'system' | 'user' | string; userId: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ListActionProposalsResponse {
  clientId: string;
  total: number;
  proposals: ActionProposal[];
}

export interface ActionProposalDetailsResponse {
  proposal: ActionProposal;
  approvals: ActionApproval[];
  executions: ActionExecution[];
}

export interface ActionProposalExecutionsResponse {
  proposalId: string;
  total: number;
  executions: ActionExecution[];
}

export interface ActionHistoryItem {
  executionId: string;
  proposalId: string;
  clientId: string;
  status: ActionExecutionStatus;
  attempts: number;
  dryRun: boolean;
  requestPayload: Record<string, unknown> | null;
  metaResponse: Record<string, unknown> | null;
  error: { message: string; stack: string | null } | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  executedBy: { type: 'system' | 'user' | string; userId: string | null };
  action: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  severity: string | null;
  entity: { type: string; id: string; name?: string | null } | null;
  source: string | null;
  proposalCreatedAt: string | null;
  proposalUpdatedAt: string | null;
}

export interface ActionHistoryResponse {
  clientId: string;
  total: number;
  history: ActionHistoryItem[];
}

export interface GenerateActionProposalsResponse {
  clientId: string;
  playbookVersion: string | null;
  period: { start: string; end: string } | null;
  candidates: number;
  created: number;
  createdIds: string[];
  skipped: number;
}

export interface ApproveActionProposalResponse {
  success: boolean;
  approvalId: string;
  proposal: ActionProposal;
}

export interface RejectActionProposalResponse {
  success: boolean;
  rejectionId: string;
  proposal: ActionProposal;
}

export interface ExecuteActionProposalResponse {
  success: boolean;
  queued: boolean;
  dryRun: boolean;
  executionId: string;
  alreadyQueued?: boolean;
  alreadyRunning?: boolean;
  alreadyCompleted?: boolean;
  retried?: boolean;
}
