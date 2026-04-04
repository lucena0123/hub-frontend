/**
 * BPMN System - API Client
 */

import { apiClient } from './client/http';

export default apiClient;

export { AUTH_TOKEN_STORAGE_KEY } from './client/http';

export { getHealth } from './client/health';

export { getClients, getClientById, createClient, updateClient, deleteClient, type ClientPayload } from './client/clients';

export {
  getCampaigns,
  updateCampaign,
  getCampaignMetrics,
  getCampaignPerformanceSummary,
  getClientPerformanceSummary,
  getClientBpmnProgress,
  updateClientBpmnProgress,
  initializeBpmnProgress,
  getBpmnSubprocessClients,
  getCampaignRuleContext,
  getPerformanceSummary,
  getClientPerformance,
  getBPMNProgress,
  updateBPMNProgress,
  updateCampaignRuleContext,
  type CampaignRuleContext,
} from './client/campaigns';

export { generateReport, generateWeeklyReport, getReportsHistory, getReportDownloadUrl } from './client/reports';

export { getProcesses, getProcessById } from './client/processes';

export { getTasks } from './client/tasks';

export { getDashboardStats, getDashboardOverview } from './client/dashboard';

export { getAlerts } from './client/alerts';

export { upsertLeadTracking, getLeadTracking, getLeadSummary, deleteLeadTracking } from './client/lead-tracking';

export {
  listActionProposals,
  getActionProposal,
  generateActionProposals,
  approveActionProposal,
  rejectActionProposal,
  executeActionProposal,
  getActionProposalExecutions,
  getActionHistory,
  type GenerateActionProposalsInput,
  type ListActionProposalsParams,
  type ListActionHistoryParams,
} from './client/action-proposals';
export type { ActionProposal } from '@/types';

export {
  getAdSetMetrics,
  getAdMetrics,
  getCreativeLibrary,
  getOptimizationCenter,
  getOptimizationCenterPlaybook,
  getCreativeCopyInsights,
  generateCreativeCopyInsights,
  getBreakdowns,
  getTemporalAnalysis,
  getBusinessMetrics,
  getCreativeWinners,
  validateCreativeCopy,
  generateCopySuggestions,
  type CreativeWinnerPattern,
  type CreativeWinnersResponse,
  type CopyValidationResult,
  type CopyValidationIssue,
  type CopySuggestion,
  type CopyGeneratorResponse,
  getAudienceInsights,
  type AudienceSegment,
  type AudienceInsightsResponse,
  getZeroConversationsDiagnostic,
  getAbTestSuggestions,
  getCampaignBenchmarks,
  getCreativeBenchmark,
  getComplianceRisk,
  getCampaignAiInsights,
  getCreativeAiInsights,
} from './client/analytics';

export {
  syncMetaAds,
  getMetaSyncDetails,
  getMetaSyncHistory,
  type MetaSyncProgress,
  type MetaSyncDetails,
  type MetaSyncHistoryResponse,
} from './client/meta-sync';

export {
  listMetaAdAccounts,
  type MetaAdAccount,
  type MetaAdAccountsResponse,
} from './client/meta-discovery';

export {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationsResponse,
} from './client/notifications';

export {
  login,
  register,
  updateProfile,
  changePassword,
} from './client/auth';

export {
  getCommercialLeads,
  getCommercialDashboard,
  getCommercialSlaAlerts,
  getCommercialDailySummary,
  getCommercialLeadTimeline,
  getCommercialIntegrationEvents,
  getCommercialDispatchHealth,
  getCommercialFollowupsDue,
  triggerCommercialFollowupDispatch,
  getCommercialRetentionDue,
  createCommercialLead,
  moveCommercialLead,
  submitCommercialForm,
  updateCommercialLeadProofs,
  updateCommercialLeadOnboarding,
  updateCommercialLeadPrivacy,
  getCommercialLeadFormLink,
  type CommercialLead,
  type CommercialLeadStatus,
  type CommercialDashboard,
  type CommercialSlaAlert,
  type CommercialDailySummary,
  type CommercialLeadTimelineEvent,
  type CommercialIntegrationEvent,
  type CommercialDispatchHealthSummary,
  type CommercialDispatchHealthByChannel,
  type CommercialFollowupDue,
  type CommercialRetentionAlert,
  type CommercialFormType,
  type CommercialFormLink,
  type ContractStatus,
  type PaymentStatus,
} from './client/commercial';

export {
  getAnomalies,
  getGlobalAnomalies,
  getCampaignHealth,
  getAutoApprovalConfig,
  updateAutoApprovalConfig,
  getOptimizationAudit,
  getOptimizationAuditSummary,
  listRuleProfiles,
  createRuleProfile,
  updateRuleProfile,
  getClientRuleBindings,
  updateClientRuleBindings,
  runRuleBackfill,
  listRuleReviewQueue,
  resolveRuleReviewItem,
  type AnomalyDetection,
  type AnomalyType,
  type CampaignHealthResult,
  type HealthFactor,
  type AutoApprovalConfig,
  type AutoApprovalRuleConfig,
  type OptimizationAuditEvent,
  type OptimizationAuditResponse,
  type OptimizationAuditSummary,
  type RuleProfileTemplate,
  type ClientRuleBinding,
  type RuleClassificationReview,
} from './client/optimization';

export {
  dispatchCommercialCommunication,
  type CommercialDispatchChannel,
  type CommercialDispatchStage,
  type DispatchCommercialCommunicationInput,
  type DispatchCommercialCommunicationResponse,
} from './client/commercial';

export {
  listContracts,
  createContract,
  activateContract,
  backfillContracts,
  listReceivables,
  recordPayment,
  listRenewals,
  type Contract,
  type Receivable,
  type PaymentRecord,
  type RenewalOpportunity,
  type CreateContractInput,
} from './client/finance';

export {
  listProjects,
  getProject,
  createProject,
  createMilestone,
  listDeliverables,
  createDeliverable,
  updateDeliverable,
  type Project,
  type Milestone,
  type Deliverable,
  type WorkItem,
  type CreateProjectInput,
} from './client/projects';

export {
  listOnboarding,
  updateOnboardingTask,
  listHealthPortfolio,
  listAccountRenewals,
  listExpansionOpportunities,
  createExpansionOpportunity,
  type OnboardingPlan,
  type OnboardingTask,
  type HealthSnapshot,
  type HealthSignal,
  type ExpansionOpportunity,
} from './client/cs';

