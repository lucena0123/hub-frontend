'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  CommercialDashboard,
  CommercialDailySummary,
  CommercialDispatchHealthSummary,
  CommercialFollowupDue,
  CommercialLead,
  CommercialLeadStatus,
  CommercialRetentionAlert,
  CommercialSlaAlert,
  getCommercialDashboard,
  getCommercialDailySummary,
  getCommercialDispatchHealth,
  getCommercialFollowupsDue,
  getCommercialLeads,
  getCommercialRetentionDue,
  getCommercialSlaAlerts,
} from '@/lib/api/client/commercial';
import { PAGE_SIZE, toApiError } from '../model';

interface UseCommercialDashboardDataParams {
  kpiRange: 'all' | 7 | 30;
  onError: (message: string) => void;
  page: number;
  responsavelFilter: 'all' | string;
  statusFilter: 'all' | CommercialLeadStatus;
}

export function useCommercialDashboardData({
  kpiRange,
  onError,
  page,
  responsavelFilter,
  statusFilter,
}: UseCommercialDashboardDataParams) {
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [kpis, setKpis] = useState<CommercialDashboard>({ total: 0, novos: 0, diagnosticos: 0, propostas: 0, fechados: 0 });
  const [slaAlerts, setSlaAlerts] = useState<CommercialSlaAlert[]>([]);
  const [dailySummary, setDailySummary] = useState<CommercialDailySummary | null>(null);
  const [dispatchHealth, setDispatchHealth] = useState<CommercialDispatchHealthSummary | null>(null);
  const [followupsDue, setFollowupsDue] = useState<CommercialFollowupDue[]>([]);
  const [retentionDue, setRetentionDue] = useState<CommercialRetentionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const [data, dashboard, alerts, summary, dispatch, dueFollowups, dueRetention] = await Promise.all([
        getCommercialLeads({
          status: statusFilter === 'all' ? undefined : statusFilter,
          responsavel: responsavelFilter === 'all' ? undefined : responsavelFilter,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        }),
        getCommercialDashboard(kpiRange === 'all' ? undefined : kpiRange),
        getCommercialSlaAlerts({ maxAgeHours: 24, limit: 5 }),
        getCommercialDailySummary(),
        getCommercialDispatchHealth(7),
        getCommercialFollowupsDue(5),
        getCommercialRetentionDue(5),
      ]);
      setLeads(data);
      setKpis(dashboard);
      setSlaAlerts(alerts);
      setDailySummary(summary);
      setDispatchHealth(dispatch);
      setFollowupsDue(dueFollowups);
      setRetentionDue(dueRetention);
    } catch (err) {
      onError(toApiError(err, 'Falha ao carregar pipeline.'));
    } finally {
      setLoading(false);
    }
  }, [kpiRange, onError, page, responsavelFilter, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return {
    dailySummary,
    dispatchHealth,
    fetchLeads,
    followupsDue,
    kpis,
    leads,
    loading,
    retentionDue,
    slaAlerts,
  };
}
