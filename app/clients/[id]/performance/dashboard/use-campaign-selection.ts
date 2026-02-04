'use client';

import { useMemo, useState } from 'react';

import type { ClientPerformanceSummary } from '@/types';

const campaignHasDelivery = (campaign: ClientPerformanceSummary['campaigns'][number]) =>
  (campaign.totalSpend ?? 0) > 0 || (campaign.totalMessagingConversations ?? 0) > 0 || (campaign.totalImpressions ?? 0) > 0;

const compareCampaignDelivery = (
  a: ClientPerformanceSummary['campaigns'][number],
  b: ClientPerformanceSummary['campaigns'][number]
) => {
  if ((b.totalSpend ?? 0) !== (a.totalSpend ?? 0)) return (b.totalSpend ?? 0) - (a.totalSpend ?? 0);
  if ((b.totalMessagingConversations ?? 0) !== (a.totalMessagingConversations ?? 0))
    return (b.totalMessagingConversations ?? 0) - (a.totalMessagingConversations ?? 0);
  if ((b.totalImpressions ?? 0) !== (a.totalImpressions ?? 0)) return (b.totalImpressions ?? 0) - (a.totalImpressions ?? 0);
  return a.campaignName.localeCompare(b.campaignName, 'pt-BR', { sensitivity: 'base' });
};

export const getDefaultCampaignIdFromSummary = (summary: ClientPerformanceSummary | null) => {
  if (!summary || summary.campaigns.length === 0) return null;

  const campaignsWithDelivery = summary.campaigns.filter(campaignHasDelivery);
  if (campaignsWithDelivery.length === 0) return null;

  return campaignsWithDelivery.slice().sort(compareCampaignDelivery)[0].campaignId;
};

export const useCampaignSelection = (summary: ClientPerformanceSummary | null) => {
  const [selectedCampaignIdState, setSelectedCampaignIdState] = useState<string | null>(null);

  const selectedCampaignId = useMemo(() => {
    if (!summary || summary.campaigns.length === 0) return null;

    if (selectedCampaignIdState && summary.campaigns.some((campaign) => campaign.campaignId === selectedCampaignIdState)) {
      return selectedCampaignIdState;
    }

    return getDefaultCampaignIdFromSummary(summary);
  }, [selectedCampaignIdState, summary]);

  const selectedCampaign = useMemo(() => {
    if (!summary || !selectedCampaignId) return null;
    return summary.campaigns.find((campaign) => campaign.campaignId === selectedCampaignId) ?? null;
  }, [summary, selectedCampaignId]);

  return {
    selectedCampaignId,
    setSelectedCampaignId: setSelectedCampaignIdState,
    selectedCampaign,
  };
};
