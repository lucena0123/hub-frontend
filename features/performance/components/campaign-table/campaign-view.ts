import type { CampaignBenchmark, ComplianceRiskCampaign, PerformanceSummary } from '@/types';
import { getPriorityMeta } from './campaign-meta';
import { formatCurrency, formatOptionalNumber, formatPercent, getRankingMeta } from './formatters';
import { getStepRate, resolveInsight } from './insights';
import { buildAdvancedKpis, buildKpiCards, buildPyramidLayers } from './metrics';
import { resolveObjectiveKey } from './objective';

interface BuildCampaignViewParams {
  campaign: PerformanceSummary;
  index: number;
  benchmarkMap: Record<string, CampaignBenchmark>;
  complianceMap: Record<string, ComplianceRiskCampaign>;
  alertScoreByCampaign: Record<string, number>;
}

export function buildCampaignView({
  campaign,
  index,
  benchmarkMap,
  complianceMap,
  alertScoreByCampaign,
}: BuildCampaignViewParams) {
  const objectiveKey = resolveObjectiveKey(campaign);
  const isMessagingObjective = objectiveKey === 'messages';
  const conversionRate =
    campaign.totalClicks > 0 ? (campaign.totalConversions / campaign.totalClicks) * 100 : 0;
  const contacts =
    objectiveKey === 'lead'
      ? campaign.totalLeads
      : objectiveKey === 'messages'
        ? campaign.totalMessagingConversations
        : campaign.totalConversions;
  const showZeroConversations =
    isMessagingObjective &&
    (campaign.totalSpend ?? 0) > 0 &&
    (campaign.totalMessagingConversations ?? 0) === 0;
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

  return {
    advancedKpis,
    benchmarkMessage,
    budgetBase,
    budgetBaseLabel,
    budgetPeriod,
    budgetRemaining,
    budgetStatus,
    budgetUsed,
    budgetUtilization,
    complianceBadge,
    complianceTooltip,
    conversionMeta,
    conversionReason,
    engagementMeta,
    engagementReason,
    hasBudgetInfo,
    insightMessage,
    isDailyBudget,
    isTopPriority,
    kpiCards,
    priorityMeta,
    priorityScore,
    pyramidLayers,
    qualityMeta,
    qualityReason,
    showZeroConversations,
  };
}
