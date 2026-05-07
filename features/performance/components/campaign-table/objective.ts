import type { PerformanceSummary } from '@/types';

export type CampaignObjectiveKey =
  | 'messages'
  | 'lead'
  | 'traffic'
  | 'video'
  | 'engagement'
  | 'awareness'
  | 'conversion';

export const resolveObjectiveKey = (campaign: PerformanceSummary): CampaignObjectiveKey => {
  const raw = (campaign.objective ?? '').toLowerCase();
  const metaDestination = (campaign.objectiveMeta?.destinationType ?? '').toLowerCase();
  const metaOptimization = (campaign.objectiveMeta?.optimizationGoal ?? '').toLowerCase();

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

  if ((campaign.totalMessagingConversations ?? 0) > 0) return 'messages';
  if ((campaign.totalLeads ?? 0) > 0) return 'lead';
  if ((campaign.totalLandingPageViews ?? 0) > 0) return 'traffic';
  return 'conversion';
};
