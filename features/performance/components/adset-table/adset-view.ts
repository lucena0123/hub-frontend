import type { AdSetMetric } from '@/types';
import {
  formatCurrency,
  formatDateLabel,
  formatNumber,
  formatOptionalNumber,
  formatPercent,
  resolveObjectiveKey,
  type AdSetObjectiveMeta,
  type AttributionSpec,
  type TargetingConfig,
} from './helpers';

export function buildAdsetView(adset: AdSetMetric, objective?: string | null, objectiveMeta?: AdSetObjectiveMeta) {
  const objectiveKey = resolveObjectiveKey(objective, objectiveMeta, adset.metadata ?? null);
  const configDestination = adset.metadata?.destinationType ?? null;
  const configOptimization = adset.metadata?.optimizationGoal ?? null;
  const configBilling = adset.metadata?.billingEvent ?? null;
  const configBidStrategy = adset.metadata?.bidStrategy ?? null;
  const configBidCap = adset.metadata?.bidCap ?? adset.metadata?.costCap ?? null;
  const configAttribution = adset.metadata?.attributionSpec ?? null;
  const configTargeting = adset.metadata?.targeting ?? null;
  const configStart = formatDateLabel(adset.metadata?.startTime ?? null);
  const configEnd = formatDateLabel(adset.metadata?.endTime ?? null);
  const targeting = configTargeting as TargetingConfig | null;
  const placements = Array.isArray(targeting?.publisher_platforms)
    ? targeting.publisher_platforms
    : [];
  const ageMin = targeting?.age_min;
  const ageMax = targeting?.age_max;
  const genders = Array.isArray(targeting?.genders)
    ? targeting.genders.map((gender) => (gender === 1 ? 'Homens' : gender === 2 ? 'Mulheres' : 'Todos')).join(', ')
    : null;
  const countries = Array.isArray(targeting?.geo_locations?.countries)
    ? targeting.geo_locations.countries
    : [];
  const targetingSummary = [
    ageMin || ageMax ? `Idade ${ageMin ?? '—'}-${ageMax ?? '—'}` : null,
    genders,
    countries.length > 0 ? `Países ${countries.slice(0, 2).join(', ')}${countries.length > 2 ? '…' : ''}` : null,
    placements.length > 0 ? `Placements ${placements.slice(0, 2).join(', ')}${placements.length > 2 ? '…' : ''}` : null,
  ].filter(Boolean);

  const attributionLabel = Array.isArray(configAttribution)
    ? configAttribution
        .map((spec: AttributionSpec) => {
          const window = spec?.window_days ?? spec?.event_type;
          const event = spec?.event_type || '';
          return `${window ?? ''}${event ? ` ${event}` : ''}`.trim();
        })
        .filter((value) => value.length > 0)
        .join(', ')
    : null;

  const configLines = [
    adset.dailyBudget ? `Orçamento diário ${formatCurrency(adset.dailyBudget)}` : null,
    adset.lifetimeBudget ? `Lifetime ${formatCurrency(adset.lifetimeBudget)}` : null,
    configBilling ? `Billing ${configBilling}` : null,
    configBidStrategy ? `Lance ${configBidStrategy}` : null,
    configBidCap ? `Cap ${configBidCap}` : null,
    configStart || configEnd ? `Período ${configStart ?? '—'} → ${configEnd ?? '—'}` : null,
    attributionLabel ? `Atribuição ${attributionLabel}` : null,
    targetingSummary.length > 0 ? `Público: ${targetingSummary.join(' · ')}` : null,
  ].filter(Boolean);

  const conversionRate = adset.totalClicks > 0 ? (adset.totalConversions / adset.totalClicks) * 100 : 0;
  const messageRate =
    adset.totalClicks > 0 ? (adset.totalMessagingConversations / adset.totalClicks) * 100 : 0;
  const lpRate =
    adset.totalClicks > 0 ? (adset.totalLandingPageViews / adset.totalClicks) * 100 : 0;
  const cpa = adset.totalConversions > 0 ? adset.totalSpend / adset.totalConversions : 0;

  const primaryLabel =
    objectiveKey === 'messages'
      ? { title: 'Conversas', value: formatNumber(adset.totalMessagingConversations) }
      : objectiveKey === 'traffic'
        ? { title: 'LP Views', value: formatOptionalNumber(adset.totalLandingPageViews) }
        : { title: 'Conversões', value: formatOptionalNumber(adset.totalConversions) };

  const pyramidLayers = [
    {
      title: 'Base — Entrega',
      primary: formatNumber(adset.totalImpressions),
      metrics: [
        { label: 'Impressões', value: formatNumber(adset.totalImpressions) },
        { label: 'Alcance', value: formatNumber(adset.totalReach) },
        { label: 'Frequência', value: `${adset.avgFrequency.toFixed(1)}x` },
        { label: 'CPM', value: formatCurrency(adset.avgCpm) },
      ],
    },
    {
      title: 'Interação — Interesse',
      primary: formatNumber(adset.totalClicks),
      metrics: [
        { label: 'Cliques', value: formatNumber(adset.totalClicks) },
        { label: 'Link clicks', value: formatOptionalNumber(adset.totalLinkClicks) },
        { label: 'CTR', value: formatPercent(adset.avgCtr, 2) },
        { label: 'CPC', value: formatCurrency(adset.avgCpc) },
      ],
    },
    {
      title: 'Ação — Resultado',
      primary: primaryLabel.value,
      metrics: [
        { label: primaryLabel.title, value: primaryLabel.value },
        {
          label: 'Cliques→Resultado',
          value: formatPercent(
            objectiveKey === 'messages' ? messageRate : objectiveKey === 'traffic' ? lpRate : conversionRate,
          ),
        },
        { label: 'CPL', value: formatCurrency(adset.cpl) },
        { label: 'CPA', value: formatCurrency(cpa) },
      ],
    },
  ];

  return {
    configDestination,
    configLines,
    configOptimization,
    objectiveKey,
    primaryLabel,
    pyramidLayers,
  };
}
