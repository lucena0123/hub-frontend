import { useEffect, useState } from 'react';

import { getAlerts, getCampaignBenchmarks, getComplianceRisk } from '@/lib/api/client';
import type { CampaignBenchmark, ComplianceRiskCampaign, ComplianceRiskResponse, PerformanceSummary } from '@/types';
import { getAlertPriorityScore } from './campaign-meta';

interface UseCampaignSignalsParams {
  campaigns: PerformanceSummary[];
  clientId: string;
}

export function useCampaignSignals({ campaigns, clientId }: UseCampaignSignalsParams) {
  const [benchmarkMap, setBenchmarkMap] = useState<Record<string, CampaignBenchmark>>({});
  const [benchmarkPeriod, setBenchmarkPeriod] = useState<{ start: string; end: string } | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [complianceMap, setComplianceMap] = useState<Record<string, ComplianceRiskCampaign>>({});
  const [complianceSummary, setComplianceSummary] = useState<ComplianceRiskResponse['summary'] | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [alertScoreByCampaign, setAlertScoreByCampaign] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!clientId || campaigns.length === 0) return;
    const period = campaigns[0]?.period;
    if (!period?.start || !period?.end) return;
    let active = true;

    const loadBenchmarks = async () => {
      try {
        setBenchmarkError(null);
        const response = await getCampaignBenchmarks(clientId, {
          startDate: period.start,
          endDate: period.end,
        });
        if (!active) return;
        const nextMap: Record<string, CampaignBenchmark> = {};
        response.campaigns.forEach((item) => {
          nextMap[item.campaignId] = item;
        });
        setBenchmarkMap(nextMap);
        setBenchmarkPeriod(response.baselinePeriod ?? null);
      } catch {
        if (!active) return;
        setBenchmarkError('Falha ao carregar baseline do cliente.');
      }
    };

    void loadBenchmarks();
    return () => {
      active = false;
    };
  }, [campaigns, clientId]);

  useEffect(() => {
    if (!clientId || campaigns.length === 0) return;
    const period = campaigns[0]?.period;
    if (!period?.start || !period?.end) return;
    let active = true;

    const loadCompliance = async () => {
      try {
        setComplianceError(null);
        const response = await getComplianceRisk(clientId, {
          startDate: period.start,
          endDate: period.end,
        });
        if (!active) return;
        const nextMap: Record<string, ComplianceRiskCampaign> = {};
        response.campaigns.forEach((item) => {
          nextMap[item.campaignId] = item;
        });
        setComplianceMap(nextMap);
        setComplianceSummary(response.summary ?? null);
      } catch {
        if (!active) return;
        setComplianceError('Falha ao carregar compliance.');
      }
    };

    void loadCompliance();
    return () => {
      active = false;
    };
  }, [campaigns, clientId]);

  useEffect(() => {
    if (!clientId || campaigns.length === 0) return;

    let active = true;

    const loadAlertScores = async () => {
      try {
        const response = await getAlerts();
        if (!active) return;

        const nextScores: Record<string, number> = {};
        response.alerts.forEach((alert) => {
          if (alert.clientId !== clientId || !alert.campaignId) return;
          const score = getAlertPriorityScore(alert);
          const current = nextScores[alert.campaignId] ?? 0;
          if (score > current) {
            nextScores[alert.campaignId] = score;
          }
        });

        setAlertScoreByCampaign(nextScores);
      } catch {
        if (!active) return;
        setAlertScoreByCampaign({});
      }
    };

    void loadAlertScores();
    return () => {
      active = false;
    };
  }, [campaigns, clientId]);

  const effectiveAlertScores = clientId && campaigns.length > 0 ? alertScoreByCampaign : {};

  return {
    alertScoreByCampaign: effectiveAlertScores,
    benchmarkError,
    benchmarkMap,
    benchmarkPeriod,
    complianceError,
    complianceMap,
    complianceSummary,
  };
}
