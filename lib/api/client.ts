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
  getPerformanceSummary,
  getClientPerformance,
  getBPMNProgress,
  updateBPMNProgress,
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
  createCommercialLead,
  moveCommercialLead,
  submitCommercialForm,
  updateCommercialLeadProofs,
  updateCommercialLeadOnboarding,
  type CommercialLead,
  type CommercialLeadStatus,
  type CommercialDashboard,
  type CommercialSlaAlert,
  type CommercialDailySummary,
  type CommercialFormType,
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
  type AnomalyDetection,
  type AnomalyType,
  type CampaignHealthResult,
  type HealthFactor,
  type AutoApprovalConfig,
  type AutoApprovalRuleConfig,
  type OptimizationAuditEvent,
  type OptimizationAuditResponse,
  type OptimizationAuditSummary,
} from './client/optimization';

