import { formatCurrency } from '@/components/performance/creative-library/formatters';
import type { AdCreativeMetric } from '@/types';

import type { ObjectiveKey } from './columns';
import { formatOptionalNumber, formatPercent } from './helpers';

export type PyramidMetric = {
  label: string;
  value: string;
};

export type PyramidLayer = {
  key: string;
  title: string;
  primary: string;
  metrics: PyramidMetric[];
};

export const buildCreativePyramid = (ad: AdCreativeMetric, objectiveKey: ObjectiveKey): PyramidLayer[] => {
  const clicks = ad.totalClicks || 0;
  const linkClicks = ad.totalLinkClicks || 0;
  const lpViews = ad.totalLandingPageViews || 0;
  const conversations = ad.totalMessagingConversations || 0;
  const leads = ad.totalLeads ?? 0;
  const purchases = ad.totalPurchases ?? 0;
  const conversions =
    objectiveKey === 'lead'
      ? leads
      : objectiveKey === 'conversion'
        ? purchases > 0
          ? purchases
          : ad.totalConversions || 0
        : ad.totalConversions || 0;
  const cpc = clicks > 0 ? ad.totalSpend / clicks : 0;
  const cpa = conversions > 0 ? ad.totalSpend / conversions : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const messageRate = clicks > 0 ? (conversations / clicks) * 100 : 0;
  const lpBaseClicks = linkClicks > 0 ? linkClicks : clicks;
  const lpRate = lpBaseClicks > 0 ? (lpViews / lpBaseClicks) * 100 : 0;
  const frequency = ad.totalReach > 0 ? ad.totalImpressions / ad.totalReach : 0;

  const base: PyramidLayer = {
    key: 'base',
    title: 'Base — Entrega',
    primary: formatOptionalNumber(ad.totalImpressions),
    metrics: [
      { label: 'Impressões', value: formatOptionalNumber(ad.totalImpressions) },
      { label: 'Alcance', value: formatOptionalNumber(ad.totalReach) },
      { label: 'Frequência', value: frequency > 0 ? `${frequency.toFixed(1)}x` : '—' },
      { label: 'CPM', value: formatCurrency(ad.avgCpm) },
    ],
  };

  const interaction: PyramidLayer = {
    key: 'interaction',
    title: 'Interação — Interesse inicial',
    primary: formatOptionalNumber(clicks),
    metrics: [
      { label: 'Cliques', value: formatOptionalNumber(clicks) },
      { label: 'Link clicks', value: formatOptionalNumber(linkClicks) },
      { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
      { label: 'CPC', value: formatCurrency(cpc) },
    ],
  };

  const action: PyramidLayer = (() => {
    if (objectiveKey === 'messages') {
      return {
        key: 'action',
        title: 'Ação — Conversas',
        primary: formatOptionalNumber(conversations),
        metrics: [
          { label: 'Conversas', value: formatOptionalNumber(conversations) },
          { label: 'Cliques→Conversas', value: formatPercent(messageRate) },
          { label: 'CPL', value: formatCurrency(ad.cpl) },
          { label: 'Custo por conversa', value: formatCurrency(ad.cpl) },
        ],
      };
    }
    if (objectiveKey === 'lead') {
      return {
        key: 'action',
        title: 'Ação — Leads',
        primary: formatOptionalNumber(conversions),
        metrics: [
          { label: 'Leads', value: formatOptionalNumber(conversions) },
          { label: 'Cliques→Leads', value: formatPercent(conversionRate) },
          { label: 'CPL', value: formatCurrency(ad.cpl) },
          { label: 'CPA', value: formatCurrency(cpa) },
        ],
      };
    }
    if (objectiveKey === 'traffic') {
      return {
        key: 'action',
        title: 'Ação — Visitas',
        primary: formatOptionalNumber(lpViews),
        metrics: [
          { label: 'LP views', value: formatOptionalNumber(lpViews) },
          { label: 'LP rate', value: formatPercent(lpRate) },
          { label: 'Link clicks', value: formatOptionalNumber(linkClicks) },
          { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
        ],
      };
    }
    if (objectiveKey === 'conversion') {
      return {
        key: 'action',
        title: 'Ação — Conversões',
        primary: formatOptionalNumber(conversions),
        metrics: [
          { label: 'Conversões', value: formatOptionalNumber(conversions) },
          { label: 'Conv %', value: formatPercent(conversionRate) },
          { label: 'CPA', value: formatCurrency(cpa) },
          { label: 'CPL', value: formatCurrency(ad.cpl) },
        ],
      };
    }
    if (objectiveKey === 'video') {
      return {
        key: 'action',
        title: 'Ação — Vídeo',
        primary: formatOptionalNumber(ad.video3secViews),
        metrics: [
          { label: '3s views', value: formatOptionalNumber(ad.video3secViews) },
          { label: 'ThruPlay', value: formatOptionalNumber(ad.videoThruplay) },
          { label: 'Hook', value: ad.hookRate > 0 ? `${ad.hookRate.toFixed(1)}%` : '—' },
          { label: 'Hold', value: ad.holdRate > 0 ? `${ad.holdRate.toFixed(1)}%` : '—' },
        ],
      };
    }
    if (objectiveKey === 'engagement') {
      return {
        key: 'action',
        title: 'Ação — Engajamento',
        primary: formatOptionalNumber(clicks),
        metrics: [
          { label: 'Cliques', value: formatOptionalNumber(clicks) },
          { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
          { label: 'CPC', value: formatCurrency(cpc) },
          { label: 'CPM', value: formatCurrency(ad.avgCpm) },
        ],
      };
    }
    return {
      key: 'action',
      title: 'Ação — Alcance',
      primary: formatOptionalNumber(ad.totalReach),
      metrics: [
        { label: 'Alcance', value: formatOptionalNumber(ad.totalReach) },
        { label: 'Frequência', value: frequency > 0 ? `${frequency.toFixed(1)}x` : '—' },
        { label: 'CPM', value: formatCurrency(ad.avgCpm) },
        { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
      ],
    };
  })();

  return [base, interaction, action];
};
