import type { AdSetMetric } from '@/types';

export type AdSetObjectiveMeta = {
  destinationType?: string | null;
  optimizationGoal?: string | null;
} | null;

export type TargetingConfig = {
  publisher_platforms?: string[];
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
  };
};

export type AttributionSpec = {
  event_type?: string;
  window_days?: number | string;
};

export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

export const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

export const formatPercent = (value: number, decimals = 1) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(decimals)}%`;
};

export const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
};

export const formatDestinationLabel = (value?: string | null) => {
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

export const formatOptimizationLabel = (value?: string | null) => {
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

export const resolveObjectiveKey = (
  objective?: string | null,
  objectiveMeta?: AdSetObjectiveMeta,
  adsetMeta?: AdSetMetric['metadata'] | null
) => {
  const raw = (objective ?? '').toLowerCase();
  const metaDestination = (objectiveMeta?.destinationType ?? '').toLowerCase();
  const metaOptimization = (objectiveMeta?.optimizationGoal ?? '').toLowerCase();
  const adsetDestination = (adsetMeta?.destinationType ?? '').toLowerCase();
  const adsetOptimization = (adsetMeta?.optimizationGoal ?? '').toLowerCase();

  if (adsetDestination.includes('message') || adsetDestination.includes('messaging') || adsetDestination.includes('whatsapp')) {
    return 'messages';
  }
  if (adsetOptimization.includes('message') || adsetOptimization.includes('messaging') || adsetOptimization.includes('conversation')) {
    return 'messages';
  }
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

  return 'conversion';
};
