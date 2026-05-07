'use client';

import { useMemo } from 'react';

import type {
  CommercialFollowupDue,
  CommercialIntegrationEvent,
  CommercialLead,
  CommercialLeadStatus,
  CommercialLeadTimelineEvent,
  CommercialRetentionAlert,
  CommercialSlaAlert,
} from '@/lib/api/client/commercial';
import {
  buildCriticalPendencies,
  buildExecutiveFunnel,
  buildOperationalBottlenecks,
  buildUnifiedTimeline,
  filterCommercialLeads,
  getResponsavelOptions,
  groupLeadsByStatus,
} from '../model';

interface UseCommercialDerivedDataParams {
  blockedOnly: boolean;
  followupsDue: CommercialFollowupDue[];
  inconsistentOnly: boolean;
  integrationEvents: CommercialIntegrationEvent[];
  leads: CommercialLead[];
  origemFilter: 'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
  responsavelFilter: 'all' | string;
  retentionDue: CommercialRetentionAlert[];
  search: string;
  selectedLead: CommercialLead | null;
  slaAlerts: CommercialSlaAlert[];
  sortBy: 'updated_desc' | 'name_asc';
  statusFilter: 'all' | CommercialLeadStatus;
  timeline: CommercialLeadTimelineEvent[];
}

export function useCommercialDerivedData({
  blockedOnly,
  followupsDue,
  inconsistentOnly,
  integrationEvents,
  leads,
  origemFilter,
  responsavelFilter,
  retentionDue,
  search,
  selectedLead,
  slaAlerts,
  sortBy,
  statusFilter,
  timeline,
}: UseCommercialDerivedDataParams) {
  const responsavelOptions = useMemo(() =>
    getResponsavelOptions(leads),
    [leads]);

  const filteredLeads = useMemo(() => filterCommercialLeads(leads, {
    statusFilter,
    origemFilter,
    responsavelFilter,
    search,
    sortBy,
    blockedOnly,
    inconsistentOnly,
  }), [leads, statusFilter, origemFilter, responsavelFilter, search, sortBy, blockedOnly, inconsistentOnly]);

  const leadsByStatus = useMemo(() => groupLeadsByStatus(filteredLeads), [filteredLeads]);

  const executiveFunnel = useMemo(() => buildExecutiveFunnel(filteredLeads, leadsByStatus), [filteredLeads, leadsByStatus]);

  const operationalBottlenecks = useMemo(() =>
    buildOperationalBottlenecks(filteredLeads, slaAlerts),
    [filteredLeads, slaAlerts]);

  const criticalPendencies = useMemo(() => buildCriticalPendencies(slaAlerts, followupsDue, retentionDue), [slaAlerts, followupsDue, retentionDue]);

  const unifiedTimeline = useMemo(() => buildUnifiedTimeline(selectedLead, timeline, integrationEvents), [selectedLead, timeline, integrationEvents]);

  return {
    criticalPendencies,
    executiveFunnel,
    filteredLeads,
    leadsByStatus,
    operationalBottlenecks,
    responsavelOptions,
    unifiedTimeline,
  };
}
