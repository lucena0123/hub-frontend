import type { PerformanceSummary } from '@/types';

import { formatOptionalCurrency, formatOptionalNumber, formatPercent } from './formatters';
import { getStepRate } from './insights';
import { resolveObjectiveKey } from './objective';
import type { PyramidLayer } from './metric-types';

export const buildPyramidLayers = (campaign: PerformanceSummary) => {
  const objectiveKey = resolveObjectiveKey(campaign);
  const lpRate = getStepRate(campaign.totalLandingPageViews || 0, campaign.totalClicks);
  const messageRate = getStepRate(campaign.totalMessagingConversations || 0, campaign.totalClicks);
  const responseRate = getStepRate(campaign.totalMessagingFirstReply || 0, campaign.totalMessagingConversations || 0);
  const conversionRate = getStepRate(campaign.totalConversions, campaign.totalClicks);
  const budgetPercent = formatPercent(campaign.budgetUtilization || 0);
  const hasRevenue = Number.isFinite(campaign.totalRevenue) && campaign.totalRevenue > 0;

  const baseLayer: PyramidLayer = {
    key: 'base',
    title: 'Base — Entrega',
    primary: formatOptionalNumber(campaign.totalImpressions),
    metrics: [
      { label: 'Impressões', value: formatOptionalNumber(campaign.totalImpressions) },
      { label: 'Alcance', value: formatOptionalNumber(campaign.totalReach) },
      { label: 'Frequência', value: `${(campaign.avgFrequency || 0).toFixed(1)}x` },
      { label: 'CPM', value: formatOptionalCurrency(campaign.avgCpm || 0) },
      { label: '% orçamento', value: budgetPercent },
    ],
  };

  const interactionLayer: PyramidLayer = {
    key: 'interaction',
    title: 'Interação — Interesse inicial',
    primary: formatOptionalNumber(campaign.totalClicks),
    metrics: [
      { label: 'Cliques', value: formatOptionalNumber(campaign.totalClicks) },
      { label: 'Link clicks', value: formatOptionalNumber(campaign.totalLinkClicks || 0) },
      { label: 'CTR', value: formatPercent(campaign.avgCtr || 0) },
      { label: 'CPC', value: formatOptionalCurrency(campaign.avgCpc || 0) },
    ],
  };

  const actionLayer: PyramidLayer = (() => {
    if (objectiveKey === 'messages') {
      return {
        key: 'action',
        title: 'Ação — Conversas',
        primary: formatOptionalNumber(campaign.totalMessagingConversations || 0),
        metrics: [
          { label: 'Conversas', value: formatOptionalNumber(campaign.totalMessagingConversations || 0) },
          { label: 'Cliques→Conversas', value: formatPercent(messageRate ?? 0) },
          { label: 'Custo por conversa', value: formatOptionalCurrency(campaign.avgCpl || 0) },
          { label: 'Resposta inicial', value: formatOptionalNumber(campaign.totalMessagingFirstReply || 0) },
        ],
      };
    }
    if (objectiveKey === 'traffic') {
      return {
        key: 'action',
        title: 'Ação — LP Views',
        primary: formatOptionalNumber(campaign.totalLandingPageViews || 0),
        metrics: [
          { label: 'LP Views', value: formatOptionalNumber(campaign.totalLandingPageViews || 0) },
          { label: 'Cliques→LP', value: formatPercent(lpRate ?? 0) },
          { label: 'CPL', value: formatOptionalCurrency(campaign.avgCpl || 0) },
          { label: 'CPC', value: formatOptionalCurrency(campaign.avgCpc || 0) },
        ],
      };
    }
    if (objectiveKey === 'lead') {
      return {
        key: 'action',
        title: 'Ação — Leads',
        primary: formatOptionalNumber(campaign.totalLeads || 0),
        metrics: [
          { label: 'Leads', value: formatOptionalNumber(campaign.totalLeads || 0) },
          { label: 'Cliques→Lead', value: formatPercent(conversionRate ?? 0) },
          { label: 'CPL', value: formatOptionalCurrency(campaign.avgCpl || 0) },
          { label: 'CPA', value: formatOptionalCurrency(campaign.avgCpa || 0) },
        ],
      };
    }

    return {
      key: 'action',
      title: 'Ação — Conversões',
      primary: formatOptionalNumber(campaign.totalConversions || 0),
      metrics: [
        { label: 'Conversões', value: formatOptionalNumber(campaign.totalConversions || 0) },
        { label: 'Cliques→Conv', value: formatPercent(conversionRate ?? 0) },
        { label: 'CPA', value: formatOptionalCurrency(campaign.avgCpa || 0) },
        { label: 'CPL', value: formatOptionalCurrency(campaign.avgCpl || 0) },
      ],
    };
  })();

  const qualificationLayer: PyramidLayer = {
    key: 'qualification',
    title: 'Qualificação — Intenção real',
    primary: formatOptionalNumber(campaign.totalMessagingFirstReply || 0),
    metrics: [
      { label: 'Resposta inicial', value: formatOptionalNumber(campaign.totalMessagingFirstReply || 0) },
      { label: 'Taxa de resposta', value: formatPercent(responseRate ?? 0) },
      { label: 'Conversas', value: formatOptionalNumber(campaign.totalMessagingConversations || 0) },
      { label: 'Leads', value: formatOptionalNumber(campaign.totalLeads || 0) },
    ],
  };

  const revenueLayer: PyramidLayer = {
    key: 'revenue',
    title: 'Receita — Resultado financeiro',
    primary: hasRevenue ? formatOptionalCurrency(campaign.totalRevenue || 0) : '—',
    metrics: hasRevenue
      ? [
          { label: 'Receita', value: formatOptionalCurrency(campaign.totalRevenue || 0) },
          { label: 'ROAS', value: Number.isFinite(campaign.roas) ? campaign.roas.toFixed(2) : '—' },
          { label: 'CPA', value: formatOptionalCurrency(campaign.avgCpa || 0) },
          { label: 'CPL', value: formatOptionalCurrency(campaign.avgCpl || 0) },
        ]
      : [
          { label: 'CPA', value: formatOptionalCurrency(campaign.avgCpa || 0) },
          { label: 'CPL', value: formatOptionalCurrency(campaign.avgCpl || 0) },
        ],
  };

  const scaleLayer: PyramidLayer = {
    key: 'scale',
    title: 'Topo — Eficiência & escala',
    primary: budgetPercent,
    metrics: [
      { label: '% orçamento', value: budgetPercent },
      { label: 'Frequência', value: `${(campaign.avgFrequency || 0).toFixed(1)}x` },
      { label: 'CPM', value: formatOptionalCurrency(campaign.avgCpm || 0) },
      { label: 'CPL', value: formatOptionalCurrency(campaign.avgCpl || 0) },
    ],
  };

  return [baseLayer, interactionLayer, actionLayer, qualificationLayer, revenueLayer, scaleLayer];
};
