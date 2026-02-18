'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZeroConversationsDialog } from '@/components/performance/zero-conversations-dialog';
import { getAlerts, getCampaignBenchmarks, getComplianceRisk, getOptimizationCenterPlaybook, updateCampaign } from '@/lib/api/client';
import type { CampaignBenchmark, ComplianceRiskCampaign, ComplianceRiskResponse, LearningSummary, PerformanceAlert, PerformanceSummary } from '@/types';

interface CampaignTableProps {
  clientId: string;
  campaigns: PerformanceSummary[];
}

const statusColors: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-primary',
  fair: 'bg-yellow-500',
  poor: 'bg-rose-500',
};

const AUTO_THEME_VALUE = '__auto__';

type ThemeOption = {
  key: string;
  name: string;
};

type SaveState = {
  status: 'idle' | 'saving' | 'error';
  message?: string;
};


const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatOptionalCurrency = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(1)}%`;
};


type RankingKind = 'quality' | 'engagement' | 'conversion';

const rankingContext: Record<RankingKind, { label: string; description: string }> = {
  quality: { label: 'Qualidade do anúncio', description: 'feedback negativo e percepção de qualidade' },
  engagement: { label: 'Engajamento esperado', description: 'chance de engajamento com o criativo' },
  conversion: { label: 'Conversão esperada', description: 'chance de conversão após o clique' },
};

const getRankingMeta = (value?: string | null, kind: RankingKind = 'quality') => {
  const context = rankingContext[kind];
  if (!value) {
    return {
      label: 'Sem ranking',
      tone: 'border-muted text-muted-foreground',
      hint: `Sem referência de ${context.label.toLowerCase()} informada pela Meta.`,
    };
  }

  const normalized = value.toLowerCase();
  if (normalized.includes('above')) {
    return {
      label: 'Acima da média',
      tone: 'border-emerald-500/30 text-emerald-300',
      hint: `Acima da média para ${context.label.toLowerCase()} (${context.description}).`,
    };
  }
  if (normalized.includes('average')) {
    return {
      label: 'Média',
      tone: 'border-amber-400/30 text-amber-200',
      hint: `Dentro do padrão esperado para ${context.label.toLowerCase()} (${context.description}).`,
    };
  }
  if (normalized.includes('below')) {
    return {
      label: 'Abaixo da média',
      tone: 'border-rose-500/40 text-rose-300',
      hint: `Abaixo da média para ${context.label.toLowerCase()} (${context.description}).`,
    };
  }

  return {
    label: value,
    tone: 'border-muted text-muted-foreground',
    hint: `Ranking informado pela plataforma para ${context.label.toLowerCase()}.`,
  };
};

const getStepRate = (numerator: number, denominator: number) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return (numerator / denominator) * 100;
};

const resolveInsight = (params: {
  ctr: number;
  cpl: number;
  conversionRate: number;
  clickToLpRate: number | null;
  lpToConvRate: number | null;
  benchmark?: CampaignBenchmark;
}) => {
  const { ctr, cpl, conversionRate, clickToLpRate, lpToConvRate, benchmark } = params;
  const ctrBaseline = benchmark?.baseline?.ctrP25 ?? benchmark?.baseline?.ctrMedian ?? null;
  const cplBaseline = benchmark?.baseline?.cplP75 ?? benchmark?.baseline?.cplMedian ?? null;

  if (ctrBaseline && ctr > 0 && ctr < ctrBaseline) {
    return 'CTR abaixo do baseline: provável problema de criativo ou audiência.';
  }
  if (cplBaseline && cpl > 0 && cpl > cplBaseline) {
    return 'CPL acima do baseline: ajuste de segmentação ou oferta.';
  }
  if (clickToLpRate !== null && clickToLpRate < 20) {
    return 'Baixa taxa de LP Views: possível lentidão ou tracking da página.';
  }
  if (lpToConvRate !== null && lpToConvRate < 5) {
    return 'Conversão baixa após LP: revisar página, oferta e formulário.';
  }
  if (conversionRate > 0 && conversionRate < 2) {
    return 'Conversão baixa: revisar funil e qualificação.';
  }
  return 'Dentro do esperado para o período.';
};

type PyramidMetric = {
  label: string;
  value: string;
};

type PyramidLayer = {
  key: string;
  title: string;
  primary: string;
  metrics: PyramidMetric[];
};

type KpiCard = {
  label: string;
  value: string;
  helper: string;
};

type KpiGroup = {
  title: string;
  items: KpiCard[];
};

const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

const resolveLearningBadge = (summary?: LearningSummary | null) => {
  if (!summary) {
    return { label: 'Sem dados', tone: 'border-muted text-muted-foreground' };
  }

  switch (summary.conclusion) {
    case 'passed':
      return { label: 'Aprendizado OK', tone: 'border-emerald-500/30 text-emerald-300' };
    case 'learning_limited':
      return { label: 'Aprendizado limitado', tone: 'border-rose-500/40 text-rose-300' };
    case 'learning':
      return { label: 'Em aprendizado', tone: 'border-amber-400/40 text-amber-200' };
    case 'events_low':
      return { label: 'Eventos insuficientes', tone: 'border-amber-400/40 text-amber-200' };
    case 'budget_low':
      return { label: 'Orçamento baixo', tone: 'border-amber-400/40 text-amber-200' };
    case 'insufficient_data':
    default:
      return { label: 'Dados incompletos', tone: 'border-muted text-muted-foreground' };
  }
};

const formatLearningValue = (value: number | null) => {
  if (!Number.isFinite(value ?? NaN) || (value ?? 0) <= 0) return '—';
  return formatOptionalCurrency(value ?? 0);
};

const buildLearningRows = (summary?: LearningSummary | null) => {
  if (!summary) return [];

  const statusLine = `${summary.statusCounts.learning} learning · ${summary.statusCounts.limited} limitado`;
  const eventsLine = `${summary.totalEventsInWindow.toLocaleString('pt-BR')} ${summary.eventLabel}`;
  const targetLine = `${summary.adsetsMeetingTarget}/${summary.adsetCount} ≥ ${summary.eventTarget}`;
  const budgetLine = `${formatLearningValue(summary.budgetDailyAverage)} · necessário ${formatLearningValue(summary.budgetDailyRequired)}`;

  return [
    { label: 'Ad sets', value: `${summary.adsetCount} (${statusLine})` },
    { label: 'Eventos (7d)', value: `${eventsLine} | ${targetLine}` },
    { label: 'Budget diário', value: budgetLine },
    {
      label: 'Cobertura',
      value: `${summary.dataCoverage.withLastEdit}/${summary.adsetCount} com edição · ${summary.dataCoverage.withBudgetData}/${summary.adsetCount} com budget`,
    },
  ];
};

const resolveObjectiveKey = (campaign: PerformanceSummary) => {
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

const buildPyramidLayers = (campaign: PerformanceSummary) => {
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

const buildKpiCards = (campaign: PerformanceSummary, objectiveKey: string): KpiCard[] => {
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

const buildAdvancedKpis = (campaign: PerformanceSummary, objectiveKey: string): KpiGroup | null => {
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

const formatDestinationLabel = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized.includes('WHATSAPP')) return 'WhatsApp';
  if (normalized.includes('MESSENGER')) return 'Messenger';
  if (normalized.includes('INSTAGRAM')) return 'Instagram';
  if (normalized.includes('FACEBOOK')) return 'Facebook';
  if (normalized.includes('APP')) return 'App';
  if (normalized.includes('SITE')) return 'Site';
  if (normalized.includes('DIRECT') || normalized.includes('MESSAGING')) return 'Mensagens';
  return value.replace(/_/g, ' ');
};

const formatOptimizationLabel = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized.includes('CONVERSATION')) return 'Conversas';
  if (normalized.includes('MESSAGE') || normalized.includes('MESSAGING')) return 'Mensagens';
  if (normalized.includes('LEAD')) return 'Leads';
  if (normalized.includes('LANDING_PAGE')) return 'LP Views';
  if (normalized.includes('LINK_CLICK')) return 'Cliques no link';
  if (normalized.includes('PURCHASE') || normalized.includes('OFFSITE_CONVERSIONS')) return 'Compras';
  if (normalized.includes('REACH')) return 'Alcance';
  if (normalized.includes('IMPRESSIONS')) return 'Impressões';
  return value.replace(/_/g, ' ');
};

const formatObjectiveLabel = (objective?: string | null, objectiveMeta?: PerformanceSummary['objectiveMeta'] | null) => {
  if (!objective) return 'Objetivo não sincronizado';
  const key = objective.toUpperCase();
  const map: Record<string, string> = {
    OUTCOME_LEADS: 'Leads',
    OUTCOME_MESSAGES: 'Mensagens',
    OUTCOME_TRAFFIC: 'Tráfego',
    OUTCOME_ENGAGEMENT: 'Engajamento',
    OUTCOME_SALES: 'Vendas',
    BRAND_AWARENESS: 'Reconhecimento',
    REACH: 'Alcance',
    APP_INSTALLS: 'Instalações',
    VIDEO_VIEWS: 'Vídeo',
    LINK_CLICKS: 'Cliques',
  };
  const base = map[key] ?? objective;

  const destination = formatDestinationLabel(objectiveMeta?.destinationType);
  const optimization = formatOptimizationLabel(objectiveMeta?.optimizationGoal);

  return `${base}${destination ? ` · ${destination}` : ''}${optimization ? ` · ${optimization}` : ''}`;
};

const getAlertPriorityScore = (alert: PerformanceAlert) => {
  const severityWeight: Record<PerformanceAlert['type'], number> = {
    critical: 10_000,
    warning: 5_000,
    info: 1_000,
  };

  const categoryBoost: Record<string, number> = {
    bpmn: 900,
    sync: 700,
    contacts: 600,
    qualification: 500,
    roas: 450,
    budget: 350,
    trend: 300,
    'creative-fatigue': 250,
    creative: 200,
    ctr: 180,
    'creative-video': 120,
    'creative-winner': 10,
  };

  const threshold = Number.isFinite(alert.threshold) ? alert.threshold : 0;
  const current = Number.isFinite(alert.currentValue) ? alert.currentValue : 0;
  const relativeGap =
    threshold !== 0 ? Math.abs((current - threshold) / Math.abs(threshold)) : Math.abs(current - threshold);
  const boundedImpact = Math.min(1_500, Math.round(relativeGap * 1_000));

  return severityWeight[alert.type] + (categoryBoost[alert.category] ?? 100) + boundedImpact;
};

const getPriorityMeta = (score: number) => {
  if (score >= 10_500) {
    return { label: 'Prioridade alta', className: 'bg-rose-500 text-white' };
  }
  if (score >= 5_300) {
    return { label: 'Prioridade média', className: 'bg-amber-400 text-amber-950' };
  }
  return { label: 'Prioridade baixa', className: 'bg-muted text-muted-foreground' };
};

export function CampaignTable({ campaigns, clientId }: CampaignTableProps) {
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
  const [themeLoading, setThemeLoading] = useState(true);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string | null>>({});
  const [subthemeOverrides, setSubthemeOverrides] = useState<Record<string, string | null>>({});
  const [subthemeDrafts, setSubthemeDrafts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [benchmarkMap, setBenchmarkMap] = useState<Record<string, CampaignBenchmark>>({});
  const [benchmarkPeriod, setBenchmarkPeriod] = useState<{ start: string; end: string } | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [complianceMap, setComplianceMap] = useState<Record<string, ComplianceRiskCampaign>>({});
  const [complianceSummary, setComplianceSummary] = useState<ComplianceRiskResponse['summary'] | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [alertScoreByCampaign, setAlertScoreByCampaign] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    const loadThemes = async () => {
      try {
        setThemeLoading(true);
        setThemeError(null);
        const playbook = await getOptimizationCenterPlaybook();
        if (!active) return;
        const options = playbook.themes.map((theme) => ({
          key: theme.key,
          name: theme.name,
        }));
        options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setThemeOptions(options);
      } catch {
        if (!active) return;
        setThemeError('Falha ao carregar temas do playbook.');
      } finally {
        if (active) setThemeLoading(false);
      }
    };

    void loadThemes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSubthemeDrafts((prev) => {
      const next = { ...prev };
      campaigns.forEach((campaign) => {
        if (next[campaign.campaignId] === undefined) {
          next[campaign.campaignId] = campaign.optimizationSubthemeKey ?? '';
        }
      });
      return next;
    });
  }, [campaigns]);

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
    if (!clientId || campaigns.length === 0) {
      setAlertScoreByCampaign({});
      return;
    }

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

  const setCampaignSaveState = (campaignId: string, next: SaveState) => {
    setSaveState((prev) => ({ ...prev, [campaignId]: next }));
  };

  const handleThemeChange = async (campaignId: string, value: string) => {
    const nextThemeKey = value === AUTO_THEME_VALUE ? null : value;
    setCampaignSaveState(campaignId, { status: 'saving' });

    try {
      if (nextThemeKey === null) {
        await updateCampaign(campaignId, {
          optimizationThemeKey: null,
          optimizationSubthemeKey: null,
        });
        setSubthemeOverrides((prev) => ({ ...prev, [campaignId]: null }));
        setSubthemeDrafts((prev) => ({ ...prev, [campaignId]: '' }));
      } else {
        await updateCampaign(campaignId, { optimizationThemeKey: nextThemeKey });
      }

      setThemeOverrides((prev) => ({ ...prev, [campaignId]: nextThemeKey }));
      setCampaignSaveState(campaignId, { status: 'idle' });
    } catch {
      setCampaignSaveState(campaignId, { status: 'error', message: 'Falha ao salvar tema.' });
    }
  };

  const handleSubthemeSave = async (campaignId: string) => {
    const draft = (subthemeDrafts[campaignId] ?? '').trim();
    const nextSubtheme = draft.length > 0 ? draft : null;
    setCampaignSaveState(campaignId, { status: 'saving' });

    try {
      await updateCampaign(campaignId, { optimizationSubthemeKey: nextSubtheme });
      setSubthemeOverrides((prev) => ({ ...prev, [campaignId]: nextSubtheme }));
      setSubthemeDrafts((prev) => ({ ...prev, [campaignId]: draft }));
      setCampaignSaveState(campaignId, { status: 'idle' });
    } catch {
      setCampaignSaveState(campaignId, { status: 'error', message: 'Falha ao salvar subtema.' });
    }
  };

  const resolveThemeKey = (campaign: PerformanceSummary) =>
    themeOverrides[campaign.campaignId] ?? campaign.optimizationThemeKey ?? null;

  const resolveSubthemeKey = (campaign: PerformanceSummary) =>
    subthemeOverrides[campaign.campaignId] ?? campaign.optimizationSubthemeKey ?? null;

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const scoreA = alertScoreByCampaign[a.campaignId] ?? 0;
    const scoreB = alertScoreByCampaign[b.campaignId] ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const spendA = Number.isFinite(a.totalSpend) ? a.totalSpend : 0;
    const spendB = Number.isFinite(b.totalSpend) ? b.totalSpend : 0;
    if (spendA !== spendB) return spendB - spendA;

    return a.campaignName.localeCompare(b.campaignName, 'pt-BR');
  });

  return (
    <Card className="edge-card border-l-2 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance por Campanha
          <Badge variant="outline">Campanhas</Badge>
        </CardTitle>
        {themeError && (
          <p className="text-xs text-rose-600">{themeError}</p>
        )}
        {benchmarkError && (
          <p className="text-xs text-rose-600">{benchmarkError}</p>
        )}
        {benchmarkPeriod && (
          <p className="text-xs text-muted-foreground">
            Baseline interno: {benchmarkPeriod.start} → {benchmarkPeriod.end} (CPL/CTR)
          </p>
        )}
        {complianceError && (
          <p className="text-xs text-rose-600">{complianceError}</p>
        )}
        {complianceSummary && (
          <div className="flex flex-wrap items-center gap-2">
            {complianceSummary.critical > 0 && (
              <Badge className="bg-rose-500 text-white text-xs">
                compliance crítico: {complianceSummary.critical}
              </Badge>
            )}
            {complianceSummary.warning > 0 && (
              <Badge className="bg-amber-400 text-amber-950 text-xs">
                compliance alerta: {complianceSummary.warning}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              Nenhuma campanha encontrada
            </div>
          ) : (
            sortedCampaigns.map((campaign, index) => {
              const themeKey = resolveThemeKey(campaign);
              const subthemeKey = resolveSubthemeKey(campaign);
              const draftSubtheme = subthemeDrafts[campaign.campaignId] ?? subthemeKey ?? '';
              const saveInfo = saveState[campaign.campaignId];
              const isSaving = saveInfo?.status === 'saving';
              const hasError = saveInfo?.status === 'error';
              const normalizedSavedSubtheme = (subthemeKey ?? '').trim();
              const normalizedDraftSubtheme = draftSubtheme.trim();
              const subthemeDirty = normalizedDraftSubtheme !== normalizedSavedSubtheme;
              const themeSelectValue = themeKey ?? AUTO_THEME_VALUE;
              const themeDisabled = themeLoading || themeOptions.length === 0 || isSaving;
              const conversionRate =
                campaign.totalClicks > 0 ? (campaign.totalConversions / campaign.totalClicks) * 100 : 0;
              const contacts =
                campaign.totalLeads > 0
                  ? campaign.totalLeads
                  : campaign.totalMessagingConversations > 0
                    ? campaign.totalMessagingConversations
                    : campaign.totalConversions;
              const showZeroConversations = (campaign.totalSpend ?? 0) > 0 && contacts === 0;
              const benchmark = benchmarkMap[campaign.campaignId];
              const benchmarkMessage = benchmark?.insights?.[0]?.message ?? null;
              const compliance = complianceMap[campaign.campaignId];
              const complianceBadge =
                compliance?.critical && compliance.critical > 0
                  ? { label: 'Compliance crítico', className: 'bg-rose-500 text-white' }
                  : compliance?.warning && compliance.warning > 0
                    ? { label: 'Compliance alerta', className: 'bg-amber-400 text-amber-950' }
                    : null;
              const complianceTooltip = compliance
                ? `Criticos: ${compliance.critical} · Alertas: ${compliance.warning} · Baixos: ${compliance.low}`
                : null;
              const priorityScore = alertScoreByCampaign[campaign.campaignId] ?? 0;
              const priorityMeta = getPriorityMeta(priorityScore);

              const pyramidLayers = buildPyramidLayers(campaign);
              const objectiveKey = resolveObjectiveKey(campaign);
              const kpiCards = buildKpiCards(campaign, objectiveKey);
              const advancedKpis = buildAdvancedKpis(campaign, objectiveKey);
              const lpRate = getStepRate(campaign.totalLandingPageViews || 0, campaign.totalClicks);
              const lpToConvRate = getStepRate(campaign.totalConversions, campaign.totalLandingPageViews || 0);
              const insightMessage = resolveInsight({
                ctr: campaign.avgCtr,
                cpl: campaign.avgCpl,
                conversionRate,
                clickToLpRate: lpRate,
                lpToConvRate,
                benchmark,
              });
              const budgetBase = campaign.budget || 0;
              const budgetType = campaign.budgetType ?? 'unknown';
              const isDailyBudget = budgetType === 'daily' || budgetType === 'adset_daily';
              const budgetBaseLabel = budgetType === 'adset_daily' ? 'Diário (adset)' : 'Diário';
              const budgetPeriod =
                campaign.budgetPeriod && campaign.budgetPeriod > 0 ? campaign.budgetPeriod : budgetBase;
              const budgetUsed = campaign.budgetUsed || 0;
              const budgetRemaining = campaign.budgetRemaining || 0;
              const hasBudgetInfo = budgetPeriod > 0 || budgetUsed > 0 || budgetRemaining > 0;
              const computedBudgetUtil =
                budgetPeriod > 0 && budgetUsed >= 0 ? (budgetUsed / budgetPeriod) * 100 : campaign.budgetUtilization || 0;
              const budgetUtilization = Number.isFinite(computedBudgetUtil) ? computedBudgetUtil : 0;
              const budgetStatus =
                budgetPeriod <= 0 && budgetUsed > 0
                  ? 'Budget não informado'
                  : budgetUtilization > 110
                    ? 'Estourado'
                    : budgetUtilization > 90
                      ? 'No limite'
                      : budgetUtilization > 0
                        ? 'Saudável'
                        : 'Sem uso';
              const qualityMeta = getRankingMeta(campaign.qualityRanking, 'quality');
              const engagementMeta = getRankingMeta(campaign.engagementRateRanking, 'engagement');
              const conversionMeta = getRankingMeta(campaign.conversionRateRanking, 'conversion');
              const qualityReason =
                contacts > 0
                  ? `Baseado no CPL ${formatCurrency(campaign.avgCpl)} em ${formatOptionalNumber(contacts)} contato(s).`
                  : 'Sem volume suficiente de contatos para leitura estável.';
              const engagementReason =
                campaign.totalImpressions > 0
                  ? `Baseado no CTR ${formatPercent(campaign.avgCtr)} em ${formatOptionalNumber(campaign.totalImpressions)} impressão(ões).`
                  : 'Sem volume suficiente de impressões para leitura estável.';
              const conversionReason =
                campaign.totalClicks > 0
                  ? `Baseado na taxa ${formatPercent(conversionRate)} em ${formatOptionalNumber(campaign.totalClicks)} clique(s).`
                  : 'Sem volume suficiente de cliques para leitura estável.';

              const isTopPriority = index === 0 && priorityScore > 0;

              return (
                <div
                  key={campaign.campaignId}
                  className={`rounded-[16px] border bg-card/70 p-5 ${
                    isTopPriority
                      ? 'border-rose-500/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35),0_0_24px_rgba(244,63,94,0.18)]'
                      : 'border-border/60'
                  }`}
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-base font-semibold leading-snug">
                            {campaign.campaignName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{campaign.platform}</span>
                            {campaign.platform === 'meta' && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 py-0 h-5 ${
                                  campaign.objective
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                                }`}
                                title="Objetivo, destino e otimização sincronizados do Meta Ads."
                              >
                            {formatObjectiveLabel(campaign.objective, campaign.objectiveMeta)}
                              </Badge>
                            )}
                            {campaign.budgetMode && campaign.budgetMode !== 'unknown' && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 py-0 h-5 ${campaign.budgetMode === 'abo'
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : campaign.budgetMode === 'cbo'
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                                  }`}
                                title="Origem do orçamento: ABO = por conjunto, CBO = por campanha."
                              >
                                {campaign.budgetMode.toUpperCase()}
                              </Badge>
                            )}
                            <Badge
                              className={statusColors[campaign.status] ?? 'bg-slate-500'}
                              title="Status de performance calculado por CTR, CPL e ROAS."
                            >
                              {campaign.status}
                            </Badge>
                            {isTopPriority && (
                              <Badge className="bg-rose-600 text-white text-[10px]" title="Card com maior prioridade operacional no cliente.">
                                Ação imediata
                              </Badge>
                            )}
                            <Badge
                              className={`text-[10px] ${priorityMeta.className}`}
                              title={`Score de prioridade: ${priorityScore}`}
                            >
                              {priorityMeta.label}
                            </Badge>
                            {complianceBadge && (
                              <Badge
                                className={`text-[10px] ${complianceBadge.className}`}
                                title={complianceTooltip ?? 'Sinalização de risco de compliance no período.'}
                              >
                                {complianceBadge.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {showZeroConversations && (
                          <ZeroConversationsDialog
                            clientId={clientId}
                            campaignId={campaign.campaignId}
                            campaignName={campaign.campaignName}
                            period={campaign.period}
                          >
                            <Button
                              variant="outline"
                              size="xs"
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            >
                              Sem conversas
                            </Button>
                          </ZeroConversationsDialog>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group">
                          <Badge variant="outline" className={`text-[10px] ${qualityMeta.tone}`}>
                            Qualidade: {qualityMeta.label}
                          </Badge>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-border/60 bg-background/95 p-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por que?</p>
                            <p className="mt-1">{qualityReason}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Comparado com campanhas similares no período.</p>
                          </div>
                        </div>
                        <div className="relative group">
                          <Badge variant="outline" className={`text-[10px] ${engagementMeta.tone}`}>
                            Engajamento: {engagementMeta.label}
                          </Badge>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-border/60 bg-background/95 p-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por que?</p>
                            <p className="mt-1">{engagementReason}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Comparado com campanhas similares no período.</p>
                          </div>
                        </div>
                        <div className="relative group">
                          <Badge variant="outline" className={`text-[10px] ${conversionMeta.tone}`}>
                            Conversão: {conversionMeta.label}
                          </Badge>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-border/60 bg-background/95 p-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por que?</p>
                            <p className="mt-1">{conversionReason}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Comparado com campanhas similares no período.</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ranking da Meta (comparativo)</p>
                        <div className="mt-2 space-y-1">
                          <p><span className="text-foreground/80">Qualidade:</span> {qualityMeta.hint}</p>
                          <p><span className="text-foreground/80">Engajamento:</span> {engagementMeta.hint}</p>
                          <p><span className="text-foreground/80">Conversão:</span> {conversionMeta.hint}</p>
                        </div>
                        {campaign.objectiveMeta && (
                          <p className="mt-1">
                            Config Meta:{' '}
                            {campaign.objectiveMeta.destinationType
                              ? `destino ${formatDestinationLabel(campaign.objectiveMeta.destinationType)}`
                              : 'destino —'}
                            {campaign.objectiveMeta.optimizationGoal
                              ? ` · otimização ${formatOptimizationLabel(campaign.objectiveMeta.optimizationGoal)}`
                              : ' · otimização —'}
                          </p>
                        )}
                        {benchmarkMessage && <p className="mt-1">{benchmarkMessage}</p>}
                        <p className="mt-1 text-foreground/80">{insightMessage}</p>
                      </div>

                      <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Aprendizado (Meta)</p>
                          {(() => {
                            const badge = resolveLearningBadge(campaign.learningSummary);
                            return (
                              <Badge variant="outline" className={`text-[10px] ${badge.tone}`}>
                                {badge.label}
                              </Badge>
                            );
                          })()}
                        </div>
                        {(() => {
                          const rows = buildLearningRows(campaign.learningSummary);
                          if (rows.length === 0) {
                            return (
                              <p className="mt-2 text-[10px] text-muted-foreground">
                                Sem dados suficientes de aprendizado para este período.
                              </p>
                            );
                          }
                          return (
                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                              {rows.map((row) => (
                                <div key={row.label} className="flex items-center justify-between gap-2">
                                  <span>{row.label}</span>
                                  <span className="text-foreground/80">{row.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {campaign.learningSummary?.notes && (
                          <p className="mt-2 text-[10px] text-muted-foreground">{campaign.learningSummary.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">PIRÂMIDE POR OBJETIVO</p>
                      <div className="space-y-2">
                        {pyramidLayers.map((layer, index) => {
                          const width = 100 - index * 8;
                          return (
                            <div key={layer.key} className="rounded-md border border-border/60 bg-muted/10 p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{layer.title}</span>
                                <span className="text-[10px] text-muted-foreground">{layer.primary}</span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary/60"
                                  style={{ width: `${width}%`, margin: '0 auto' }}
                                />
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                {layer.metrics.map((metric) => (
                                  <div key={`${layer.key}-${metric.label}`} className="flex items-center justify-between gap-2">
                                    <span>{metric.label}</span>
                                    <span className="text-foreground/80">{metric.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {kpiCards.map((card) => (
                          <div key={card.label} className="rounded-md border border-border/60 p-3 bg-muted/20">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</p>
                            <p className="text-sm font-semibold">{card.value}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{card.helper}</p>
                          </div>
                        ))}
                      </div>
                      {advancedKpis && (
                        <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{advancedKpis.title}</p>
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                              Avançado
                            </Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            {advancedKpis.items.map((item) => (
                              <div key={item.label} className="rounded-md border border-border/60 bg-background/40 p-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-semibold">{item.value}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{item.helper}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="grid gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Tema & Subtema</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                          value={themeSelectValue}
                          onValueChange={(value) => handleThemeChange(campaign.campaignId, value)}
                          disabled={themeDisabled}
                        >
                          <SelectTrigger className="h-8 min-w-[200px]">
                            <SelectValue placeholder="Definir tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AUTO_THEME_VALUE}>Automático</SelectItem>
                            {themeOptions.map((theme) => (
                              <SelectItem key={theme.key} value={theme.key}>
                                {theme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Input
                            value={draftSubtheme}
                            onChange={(e) =>
                              setSubthemeDrafts((prev) => ({
                                ...prev,
                                [campaign.campaignId]: e.target.value,
                              }))
                            }
                            placeholder={themeKey ? 'Subtema (opcional)' : 'Selecione um tema'}
                            disabled={!themeKey || isSaving}
                            className="h-8"
                          />
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleSubthemeSave(campaign.campaignId)}
                            disabled={!themeKey || isSaving || !subthemeDirty}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                      {isSaving && (
                        <span className="text-xs text-muted-foreground">Salvando...</span>
                      )}
                      {hasError && (
                        <span className="text-xs text-rose-600">{saveInfo?.message ?? 'Falha ao salvar.'}</span>
                      )}

                      <div className="pt-1">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Ações rápidas</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="xs" variant="outline" asChild>
                            <Link href={`/optimization/board?clientId=${clientId}`}>Ir para board</Link>
                          </Button>
                          <Button size="xs" variant="outline" asChild>
                            <Link href={`/optimization/settings?clientId=${clientId}`}>Ajustar regras</Link>
                          </Button>
                          <Button size="xs" variant="outline" asChild>
                            <Link href={`/optimization/effectiveness?clientId=${clientId}`}>Ver efetividade</Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {hasBudgetInfo ? (
                      <div className="rounded-md border border-border/60 p-3 bg-muted/20 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${budgetStatus === 'Estourado'
                                ? 'border-rose-500/40 text-rose-300'
                                : budgetStatus === 'No limite'
                                  ? 'border-amber-400/40 text-amber-200'
                                  : 'border-emerald-500/30 text-emerald-300'
                              }`}
                          >
                            {budgetStatus}
                          </Badge>
                        </div>
                        {isDailyBudget ? (
                          <>
                            <p className="mt-1">{budgetBaseLabel} {formatOptionalCurrency(budgetBase)}</p>
                            <p>Total período {formatOptionalCurrency(budgetPeriod)}</p>
                          </>
                        ) : (
                          <p className="mt-1">Total {formatOptionalCurrency(budgetPeriod)}</p>
                        )}
                        <p>Usado {formatOptionalCurrency(budgetUsed)}</p>
                        <p>Restante {formatOptionalCurrency(budgetRemaining)}</p>
                        <p className="mt-1 text-muted-foreground">% uso {formatPercent(budgetUtilization || 0)}</p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-border/60 p-3 bg-muted/10 text-xs text-muted-foreground">
                        Budget indisponível para este período.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
