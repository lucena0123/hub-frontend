import type { AdCreativeMetric } from '@/types';

export type ObjectiveKey = 'messages' | 'lead' | 'traffic' | 'conversion' | 'video' | 'engagement' | 'awareness';

export type MetricColumn = {
  key:
    | 'conversations'
    | 'leads'
    | 'conversions'
    | 'cpl'
    | 'clicks'
    | 'linkClicks'
    | 'lpViews'
    | 'lpRate'
    | 'ctr'
    | 'cpc'
    | 'cpa'
    | 'convRate'
    | 'messageRate'
    | 'cpm'
    | 'impressions'
    | 'reach'
    | 'frequency'
    | 'video3s'
    | 'thruplay'
    | 'hookRate'
    | 'holdRate'
    | 'invest';
  label: string;
};

export type CreativeObjectiveMeta = {
  optimizationGoal?: string | null;
  destinationType?: string | null;
  billingEvent?: string | null;
} | null | undefined;

export const resolveObjectiveKey = (
  objective: string | null | undefined,
  objectiveMeta: CreativeObjectiveMeta,
  ads: AdCreativeMetric[]
): ObjectiveKey => {
  const raw = (objective ?? '').toLowerCase();
  const metaDestination = (objectiveMeta?.destinationType ?? '').toLowerCase();
  const metaOptimization = (objectiveMeta?.optimizationGoal ?? '').toLowerCase();

  if (metaDestination.includes('message') || metaDestination.includes('messaging') || metaDestination.includes('whatsapp')) {
    return 'messages';
  }
  if (metaOptimization.includes('message') || metaOptimization.includes('messaging') || metaOptimization.includes('conversation')) {
    return 'messages';
  }

  if (raw.includes('message') || raw.includes('messaging')) return 'messages';
  if (raw.includes('lead')) return 'lead';
  if (raw.includes('traffic')) return 'traffic';
  if (raw.includes('video')) return 'video';
  if (raw.includes('engagement')) return 'engagement';
  if (raw.includes('awareness') || raw.includes('reach') || raw.includes('brand')) return 'awareness';
  if (raw.includes('conversion') || raw.includes('sales') || raw.includes('purchase')) return 'conversion';

  if (ads.some((ad) => ad.totalMessagingConversations > 0)) return 'messages';
  if (ads.some((ad) => ad.totalConversions > 0)) return 'conversion';
  if (ads.some((ad) => ad.totalLandingPageViews > 0)) return 'traffic';
  return 'traffic';
};

export const buildColumns = (objectiveKey: ObjectiveKey, hasVideoData: boolean): MetricColumn[] => {
  switch (objectiveKey) {
    case 'messages':
      return [
        { key: 'conversations', label: 'Conversas' },
        { key: 'cpl', label: 'CPL' },
        { key: 'messageRate', label: 'Cliques→Conversas' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'lead':
      return [
        { key: 'leads', label: 'Leads' },
        { key: 'cpl', label: 'CPL' },
        { key: 'convRate', label: 'Cliques→Leads' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'traffic':
      return [
        { key: 'linkClicks', label: 'Link clicks' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'lpViews', label: 'LP views' },
        { key: 'lpRate', label: 'LP rate' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'conversion':
      return [
        { key: 'conversions', label: 'Conversões' },
        { key: 'cpa', label: 'CPA' },
        { key: 'convRate', label: 'Conv %' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'video':
      if (!hasVideoData) {
        return buildColumns('traffic', hasVideoData);
      }
      return [
        { key: 'video3s', label: '3s views' },
        { key: 'thruplay', label: 'ThruPlay' },
        { key: 'hookRate', label: 'Hook' },
        { key: 'holdRate', label: 'Hold' },
        { key: 'ctr', label: 'CTR' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'engagement':
      return [
        { key: 'clicks', label: 'Cliques' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'cpm', label: 'CPM' },
        { key: 'impressions', label: 'Impressões' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'awareness':
      return [
        { key: 'impressions', label: 'Impressões' },
        { key: 'reach', label: 'Alcance' },
        { key: 'frequency', label: 'Frequência' },
        { key: 'cpm', label: 'CPM' },
        { key: 'ctr', label: 'CTR' },
        { key: 'invest', label: 'Investimento' },
      ];
    default:
      return buildColumns('traffic', hasVideoData);
  }
};
