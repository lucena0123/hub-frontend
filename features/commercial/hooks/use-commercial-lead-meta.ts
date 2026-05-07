'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  CommercialAsset,
  CommercialIntegrationEvent,
  CommercialLead,
  CommercialLeadTimelineEvent,
  CommercialRequirementStatus,
  getCommercialIntegrationEvents,
  getCommercialLeadAssets,
  getCommercialLeadRequirements,
  getCommercialLeadTimeline,
} from '@/lib/api/client/commercial';

export function useCommercialLeadMeta(selectedLead: CommercialLead | null) {
  const [timeline, setTimeline] = useState<CommercialLeadTimelineEvent[]>([]);
  const [integrationEvents, setIntegrationEvents] = useState<CommercialIntegrationEvent[]>([]);
  const [leadRequirements, setLeadRequirements] = useState<CommercialRequirementStatus[]>([]);
  const [leadAssets, setLeadAssets] = useState<CommercialAsset[]>([]);
  const [leadMetaLoading, setLeadMetaLoading] = useState(false);

  const clearLeadMeta = useCallback(() => {
    setTimeline([]);
    setIntegrationEvents([]);
    setLeadRequirements([]);
    setLeadAssets([]);
  }, []);

  const refreshSelectedLeadMeta = useCallback(async (leadId: string) => {
    try {
      setLeadMetaLoading(true);
      const [requirements, assets, events, integrations] = await Promise.all([
        getCommercialLeadRequirements(leadId).then((res) => res.requirements),
        getCommercialLeadAssets(leadId),
        getCommercialLeadTimeline(leadId, 20),
        getCommercialIntegrationEvents(leadId, 20),
      ]);
      setLeadRequirements(requirements);
      setLeadAssets(assets);
      setTimeline(events);
      setIntegrationEvents(integrations);
    } finally {
      setLeadMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLead) {
      clearLeadMeta();
      return;
    }

    setLeadMetaLoading(true);
    Promise.all([
      getCommercialLeadTimeline(selectedLead.leadId, 20),
      getCommercialIntegrationEvents(selectedLead.leadId, 20),
      getCommercialLeadRequirements(selectedLead.leadId).then((res) => res.requirements),
      getCommercialLeadAssets(selectedLead.leadId),
    ]).then(([events, integrations, requirements, assets]) => {
      setTimeline(events);
      setIntegrationEvents(integrations);
      setLeadRequirements(requirements);
      setLeadAssets(assets);
    }).catch(() => {
      clearLeadMeta();
    }).finally(() => setLeadMetaLoading(false));
  }, [clearLeadMeta, selectedLead]);

  return {
    timeline,
    integrationEvents,
    leadRequirements,
    leadAssets,
    leadMetaLoading,
    refreshSelectedLeadMeta,
  };
}
