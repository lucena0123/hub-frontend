import type {
  GenerateActionProposalsInput,
} from '@/lib/api/client';
import type {
  MetricsQuery,
  OptimizationCenterResponse,
  OptimizationCenterSeverity,
} from '@/types';

export function buildPrioritizedItems(items: OptimizationCenterResponse['items']) {
  const severityOrder: Record<OptimizationCenterSeverity, number> = {
    critical: 0,
    warning: 1,
    opportunity: 2,
    info: 3,
  };

  return [...items].sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 99;
    const sb = severityOrder[b.severity] ?? 99;
    if (sa !== sb) return sa - sb;
    return a.title.localeCompare(b.title, 'pt-BR');
  });
}

export function buildFocusItems(
  items: OptimizationCenterResponse['items'],
  showInfo: boolean,
  showAll: boolean,
) {
  const base = showInfo ? items : items.filter((item) => item.severity !== 'info');
  return showAll ? base : base.slice(0, 5);
}

export function buildGeneratePayload(
  metricsQuery: MetricsQuery | undefined,
  selectedCampaignId: string | null | undefined,
): GenerateActionProposalsInput {
  const payload: GenerateActionProposalsInput = {};
  if (metricsQuery?.period) payload.period = metricsQuery.period;
  if (metricsQuery?.startDate) payload.startDate = metricsQuery.startDate;
  if (metricsQuery?.endDate) payload.endDate = metricsQuery.endDate;
  if (selectedCampaignId) payload.campaignId = selectedCampaignId;
  return payload;
}
