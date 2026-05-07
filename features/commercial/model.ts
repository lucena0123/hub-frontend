export { toApiError, toApiErrorWithReason } from './api-errors';
export {
  COLUMNS,
  getDispatchStage,
  LOSS_REASONS,
  NEXT_STATUS,
  NURTURE_REASONS,
  PAGE_SIZE,
} from './constants';
export {
  buildCriticalPendencies,
  buildExecutiveFunnel,
  buildOperationalBottlenecks,
  filterCommercialLeads,
  groupLeadsByStatus,
} from './model/derived';
export {
  getAdvanceGuard,
  getResponsavelOptions,
  hasOperationalInconsistency,
  isLeadBlocked,
} from './model/lead-rules';
export { buildUnifiedTimeline, mapIntegrationEventLabel } from './model/timeline';
export type {
  ComercialErrorAction,
  CommercialLeadFilters,
  ConcluirDiagLead,
  PendingTransition,
  UnifiedTimelineItem,
} from './model/types';
