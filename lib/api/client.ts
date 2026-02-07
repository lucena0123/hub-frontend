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
  type GenerateActionProposalsInput,
  type ListActionProposalsParams,
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
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationsResponse,
} from './client/notifications';

