import type { PerformanceSummary } from '@/types';

import { formatCurrency, formatOptionalCurrency, formatOptionalNumber, formatPercent } from './formatters';
import type { CampaignObjectiveKey } from './objective';
import type { KpiCard } from './metric-types';

export const buildKpiCards = (campaign: PerformanceSummary, objectiveKey: CampaignObjectiveKey): KpiCard[] => {
  const conversionRate =
    campaign.totalClicks > 0 ? (campaign.totalConversions / campaign.totalClicks) * 100 : 0;
  const messagesRate =
    campaign.totalClicks > 0 ? (campaign.totalMessagingConversations / campaign.totalClicks) * 100 : 0;
  const leadRate = campaign.totalClicks > 0 ? (campaign.totalLeads / campaign.totalClicks) * 100 : 0;
  const lpRate =
    campaign.totalClicks > 0 ? ((campaign.totalLandingPageViews || 0) / campaign.totalClicks) * 100 : 0;

  if (objectiveKey === 'messages') {
    return [
      {
        label: 'Investimento',
        value: formatCurrency(campaign.totalSpend),
        helper: `CPL ${formatOptionalCurrency(campaign.avgCpl || 0)}`,
      },
      {
        label: 'Conversas',
        value: formatOptionalNumber(campaign.totalMessagingConversations || 0),
        helper: `Cliques→Conversas ${formatPercent(messagesRate)}`,
      },
      {
        label: 'CTR / CPC',
        value: formatPercent(campaign.avgCtr || 0),
        helper: `CPC ${formatOptionalCurrency(campaign.avgCpc || 0)}`,
      },
      {
        label: 'CPM / Freq',
        value: formatOptionalCurrency(campaign.avgCpm || 0),
        helper: `${(campaign.avgFrequency || 0).toFixed(1)}x`,
      },
    ];
  }

  if (objectiveKey === 'lead') {
    return [
      {
        label: 'Investimento',
        value: formatCurrency(campaign.totalSpend),
        helper: `CPL ${formatOptionalCurrency(campaign.avgCpl || 0)}`,
      },
      {
        label: 'Leads',
        value: formatOptionalNumber(campaign.totalLeads || 0),
        helper: `Cliques→Leads ${formatPercent(leadRate)}`,
      },
      {
        label: 'CTR / CPC',
        value: formatPercent(campaign.avgCtr || 0),
        helper: `CPC ${formatOptionalCurrency(campaign.avgCpc || 0)}`,
      },
      {
        label: 'CPM / Freq',
        value: formatOptionalCurrency(campaign.avgCpm || 0),
        helper: `${(campaign.avgFrequency || 0).toFixed(1)}x`,
      },
    ];
  }

  if (objectiveKey === 'traffic') {
    return [
      {
        label: 'Investimento',
        value: formatCurrency(campaign.totalSpend),
        helper: `CPC ${formatOptionalCurrency(campaign.avgCpc || 0)}`,
      },
      {
        label: 'LP Views',
        value: formatOptionalNumber(campaign.totalLandingPageViews || 0),
        helper: `Cliques→LP ${formatPercent(lpRate)}`,
      },
      {
        label: 'CTR / Cliques',
        value: formatPercent(campaign.avgCtr || 0),
        helper: `${formatOptionalNumber(campaign.totalClicks)} cliques`,
      },
      {
        label: 'CPM / Freq',
        value: formatOptionalCurrency(campaign.avgCpm || 0),
        helper: `${(campaign.avgFrequency || 0).toFixed(1)}x`,
      },
    ];
  }

  if (objectiveKey === 'awareness' || objectiveKey === 'engagement' || objectiveKey === 'video') {
    return [
      {
        label: 'Investimento',
        value: formatCurrency(campaign.totalSpend),
        helper: `CPM ${formatOptionalCurrency(campaign.avgCpm || 0)}`,
      },
      {
        label: 'Alcance',
        value: formatOptionalNumber(campaign.totalReach || 0),
        helper: `Frequência ${(campaign.avgFrequency || 0).toFixed(1)}x`,
      },
      {
        label: 'Impressões',
        value: formatOptionalNumber(campaign.totalImpressions || 0),
        helper: `CTR ${formatPercent(campaign.avgCtr || 0)}`,
      },
      {
        label: 'Cliques / CPC',
        value: formatOptionalNumber(campaign.totalClicks || 0),
        helper: `CPC ${formatOptionalCurrency(campaign.avgCpc || 0)}`,
      },
    ];
  }

  const hasRevenue = Number.isFinite(campaign.totalRevenue) && campaign.totalRevenue > 0;
  return [
    {
      label: 'Investimento',
      value: formatCurrency(campaign.totalSpend),
      helper: `CPA ${formatOptionalCurrency(campaign.avgCpa || 0)}`,
    },
    {
      label: 'Conversões',
      value: formatOptionalNumber(campaign.totalConversions || 0),
      helper: `Cliques→Conv ${formatPercent(conversionRate)}`,
    },
    {
      label: 'CTR / CPC',
      value: formatPercent(campaign.avgCtr || 0),
      helper: `CPC ${formatOptionalCurrency(campaign.avgCpc || 0)}`,
    },
    {
      label: hasRevenue ? 'ROAS / Receita' : 'CPA / CPL',
      value: hasRevenue ? (Number.isFinite(campaign.roas) ? campaign.roas.toFixed(2) : '—') : formatOptionalCurrency(campaign.avgCpa || 0),
      helper: hasRevenue ? formatOptionalCurrency(campaign.totalRevenue || 0) : `CPL ${formatOptionalCurrency(campaign.avgCpl || 0)}`,
    },
  ];
};
