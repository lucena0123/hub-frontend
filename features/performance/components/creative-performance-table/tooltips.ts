import { formatCurrency } from '@/components/performance/creative-library/formatters';

import type { MetricColumn, ObjectiveKey } from './columns';
import { formatOptionalNumber } from './helpers';

export const buildMetricTooltip = (params: {
  key: MetricColumn['key'];
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  lpViews: number;
  conversations: number;
  leads: number;
  purchases: number;
  conversions: number;
  objectiveKey: ObjectiveKey;
  video3s: number;
  thruplay: number;
  reach: number;
}) => {
  const {
    key,
    spend,
    impressions,
    clicks,
    linkClicks,
    lpViews,
    conversations,
    leads,
    purchases,
    conversions,
    objectiveKey,
    video3s,
    thruplay,
    reach,
  } = params;

  const sourceMeta = 'Fonte: Meta Ads (insights)';
  const sourceCalc = 'Fonte: cálculo (totais do período)';

  switch (key) {
    case 'conversations':
    case 'leads':
    case 'clicks':
    case 'linkClicks':
    case 'lpViews':
    case 'impressions':
    case 'reach':
    case 'video3s':
    case 'thruplay':
    case 'invest':
      return { source: sourceMeta, formula: 'Valor bruto do Meta Ads.' };
    case 'conversions': {
      const label =
        objectiveKey === 'lead'
          ? 'leads'
          : objectiveKey === 'conversion'
            ? purchases > 0
              ? 'compras'
              : 'conversões'
            : 'conversões';
      return { source: sourceMeta, formula: `Valor bruto do Meta Ads (${label}).` };
    }
    case 'ctr':
      return {
        source: sourceCalc,
        formula: `CTR = ${formatOptionalNumber(clicks)} ÷ ${formatOptionalNumber(impressions)} × 100`,
      };
    case 'cpc':
      return {
        source: sourceCalc,
        formula: `CPC = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(clicks)}`,
      };
    case 'cpm':
      return {
        source: sourceCalc,
        formula: `CPM = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(impressions)} × 1000`,
      };
    case 'frequency':
      return {
        source: sourceCalc,
        formula: `Frequência = ${formatOptionalNumber(impressions)} ÷ ${formatOptionalNumber(reach)}`,
      };
    case 'cpl': {
      const baseLabel =
        objectiveKey === 'messages'
          ? 'conversas'
          : objectiveKey === 'lead'
            ? 'leads'
            : objectiveKey === 'conversion'
              ? 'conversões'
              : 'contatos';
      const baseValue =
        objectiveKey === 'messages'
          ? conversations
          : objectiveKey === 'lead'
            ? leads
            : objectiveKey === 'conversion'
              ? conversions
              : conversions;
      return {
        source: sourceCalc,
        formula: `CPL = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(baseValue)} (${baseLabel})`,
      };
    }
    case 'cpa':
      return {
        source: sourceCalc,
        formula: `CPA = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(conversions)}`,
      };
    case 'convRate': {
      const baseLabel = objectiveKey === 'lead' ? 'leads' : 'conversões';
      return {
        source: sourceCalc,
        formula: `Conv% = ${formatOptionalNumber(conversions)} (${baseLabel}) ÷ ${formatOptionalNumber(clicks)} × 100`,
      };
    }
    case 'messageRate':
      return {
        source: sourceCalc,
        formula: `Cliques→Conversas = ${formatOptionalNumber(conversations)} ÷ ${formatOptionalNumber(clicks)} × 100`,
      };
    case 'lpRate': {
      const base = linkClicks > 0 ? linkClicks : clicks;
      const baseLabel = linkClicks > 0 ? 'link clicks' : 'cliques';
      return {
        source: sourceCalc,
        formula: `LP rate = ${formatOptionalNumber(lpViews)} ÷ ${formatOptionalNumber(base)} (${baseLabel}) × 100`,
      };
    }
    case 'hookRate':
      return {
        source: sourceCalc,
        formula: `Hook = ${formatOptionalNumber(video3s)} ÷ ${formatOptionalNumber(impressions)} × 100`,
      };
    case 'holdRate':
      return {
        source: sourceCalc,
        formula: `Hold = ${formatOptionalNumber(thruplay)} ÷ ${formatOptionalNumber(video3s)} × 100`,
      };
    default:
      return null;
  }
};
