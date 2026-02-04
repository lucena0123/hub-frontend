'use client';

import { useMemo, useState } from 'react';

import type { ClientPerformanceSummary } from '@/types';

export const useCampaignSelection = (summary: ClientPerformanceSummary | null) => {
  const [selectedCampaignIdState, setSelectedCampaignIdState] = useState<string | null>(null);

  const selectedCampaignId = useMemo(() => {
    if (!summary || summary.campaigns.length === 0) return null;

    if (selectedCampaignIdState && summary.campaigns.some((campaign) => campaign.campaignId === selectedCampaignIdState)) {
      return selectedCampaignIdState;
    }

    return summary.campaigns[0].campaignId;
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
