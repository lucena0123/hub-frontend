import type { PerformanceSummary } from '@/types';

import { formatOptionalCurrency, formatOptionalNumber, formatPercent } from './formatters';
import type { CampaignObjectiveKey } from './objective';
import type { KpiGroup } from './metric-types';

export const buildAdvancedKpis = (campaign: PerformanceSummary, objectiveKey: CampaignObjectiveKey): KpiGroup | null => {
  const clickToMessageRate =
    campaign.totalClicks > 0 ? (campaign.totalMessagingConversations / campaign.totalClicks) * 100 : 0;
  const responseRate =
    campaign.totalMessagingConversations > 0
      ? ((campaign.leadsResponded || 0) / campaign.totalMessagingConversations) * 100
      : 0;
  const lpToConvRate =
    campaign.totalLandingPageViews > 0 ? (campaign.totalConversions / campaign.totalLandingPageViews) * 100 : 0;
  const conversionRate =
    campaign.totalClicks > 0 ? (campaign.totalConversions / campaign.totalClicks) * 100 : 0;
  const leadRate =
    campaign.totalClicks > 0 ? (campaign.totalLeads / campaign.totalClicks) * 100 : 0;
  const hasRevenue = Number.isFinite(campaign.totalRevenue) && campaign.totalRevenue > 0;
  const hasResponseTime = campaign.avgResponseTimeHours != null && Number.isFinite(campaign.avgResponseTimeHours);

  if (objectiveKey === 'messages') {
    return {
      title: 'KPIs avançados — Mensagens',
      items: [
        {
          label: 'Cliques → Conversas',
          value: formatPercent(clickToMessageRate),
          helper: `${formatOptionalNumber(campaign.totalMessagingConversations || 0)} conversas`,
        },
        {
          label: 'Taxa de resposta',
          value: formatPercent(responseRate),
          helper: `${formatOptionalNumber(campaign.leadsResponded || 0)} respostas`,
        },
        {
          label: 'Custo por conversa',
          value: formatOptionalCurrency(campaign.avgCpl || 0),
          helper: `CPA ${formatOptionalCurrency(campaign.avgCpa || 0)}`,
        },
        {
          label: 'Tempo de resposta',
          value: hasResponseTime ? `${campaign.avgResponseTimeHours!.toFixed(1)}h` : '—',
          helper: hasResponseTime ? 'média de atendimento' : 'Sem SLA informado',
        },
      ],
    };
  }

  if (objectiveKey === 'lead') {
    return {
      title: 'KPIs avançados — Leads',
      items: [
        {
          label: 'Cliques → Leads',
          value: formatPercent(leadRate),
          helper: `${formatOptionalNumber(campaign.totalLeads || 0)} leads`,
        },
        {
          label: 'CPA',
          value: formatOptionalCurrency(campaign.avgCpa || 0),
          helper: `CPL ${formatOptionalCurrency(campaign.avgCpl || 0)}`,
        },
        {
          label: 'CPM',
          value: formatOptionalCurrency(campaign.avgCpm || 0),
          helper: `${(campaign.avgFrequency || 0).toFixed(1)}x`,
        },
        {
          label: 'Alcance',
          value: formatOptionalNumber(campaign.totalReach || 0),
          helper: `${formatOptionalNumber(campaign.totalImpressions || 0)} impressões`,
        },
      ],
    };
  }

  if (objectiveKey === 'traffic') {
    return {
      title: 'KPIs avançados — Tráfego',
      items: [
        {
          label: 'Cliques → LP',
          value: formatPercent(
            campaign.totalClicks > 0 ? ((campaign.totalLandingPageViews || 0) / campaign.totalClicks) * 100 : 0
          ),
          helper: `${formatOptionalNumber(campaign.totalLandingPageViews || 0)} LP views`,
        },
        {
          label: 'Cliques',
          value: formatOptionalNumber(campaign.totalClicks || 0),
          helper: `CTR ${formatPercent(campaign.avgCtr || 0)}`,
        },
        {
          label: 'CPM',
          value: formatOptionalCurrency(campaign.avgCpm || 0),
          helper: `${(campaign.avgFrequency || 0).toFixed(1)}x`,
        },
        {
          label: 'CPL',
          value: formatOptionalCurrency(campaign.avgCpl || 0),
          helper: `CPA ${formatOptionalCurrency(campaign.avgCpa || 0)}`,
        },
      ],
    };
  }

  if (objectiveKey === 'awareness' || objectiveKey === 'engagement' || objectiveKey === 'video') {
    return {
      title: 'KPIs avançados — Awareness',
      items: [
        {
          label: 'Frequência',
          value: `${(campaign.avgFrequency || 0).toFixed(1)}x`,
          helper: `CPM ${formatOptionalCurrency(campaign.avgCpm || 0)}`,
        },
        {
          label: 'CTR',
          value: formatPercent(campaign.avgCtr || 0),
          helper: `CPC ${formatOptionalCurrency(campaign.avgCpc || 0)}`,
        },
        {
          label: 'Cliques',
          value: formatOptionalNumber(campaign.totalClicks || 0),
          helper: `${formatOptionalNumber(campaign.totalImpressions || 0)} impressões`,
        },
        {
          label: 'Alcance',
          value: formatOptionalNumber(campaign.totalReach || 0),
          helper: `${formatOptionalNumber(campaign.totalImpressions || 0)} impressões`,
        },
      ],
    };
  }

  return {
    title: 'KPIs avançados — Conversões',
    items: [
      {
        label: 'Cliques → Conv',
        value: formatPercent(conversionRate),
        helper: `${formatOptionalNumber(campaign.totalConversions || 0)} conversões`,
      },
      {
        label: 'LP → Conv',
        value: formatPercent(lpToConvRate),
        helper: `${formatOptionalNumber(campaign.totalLandingPageViews || 0)} LP views`,
      },
      {
        label: hasRevenue ? 'Receita' : 'Receita',
        value: hasRevenue ? formatOptionalCurrency(campaign.totalRevenue || 0) : '—',
        helper: hasRevenue ? `ROAS ${Number.isFinite(campaign.roas) ? campaign.roas.toFixed(2) : '—'}` : 'Sem receita registrada',
      },
      {
        label: 'CPA',
        value: formatOptionalCurrency(campaign.avgCpa || 0),
        helper: `CPL ${formatOptionalCurrency(campaign.avgCpl || 0)}`,
      },
    ],
  };
};
