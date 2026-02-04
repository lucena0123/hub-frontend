import type { MetricsPeriod, MetricsQuery } from '@/types';

export type MetricsQueryInput = MetricsQuery | MetricsPeriod | undefined;

export const normalizeMetricsQuery = (query: MetricsQueryInput): MetricsQuery | undefined => {
  if (!query) return undefined;
  if (typeof query === 'string') return { period: query };

  const params: MetricsQuery = {};
  if (query.period) params.period = query.period;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  if (query.platform) params.platform = query.platform;
  if (query.campaignId) params.campaignId = query.campaignId;

  return params;
};

