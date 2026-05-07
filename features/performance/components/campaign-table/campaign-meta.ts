import type { PerformanceAlert, PerformanceSummary } from '@/types';

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

export const formatObjectiveLabel = (
  objective?: string | null,
  objectiveMeta?: PerformanceSummary['objectiveMeta'] | null
) => {
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

export const getAlertPriorityScore = (alert: PerformanceAlert) => {
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

export const getPriorityMeta = (score: number) => {
  if (score >= 10_500) {
    return { label: 'Prioridade alta', className: 'bg-rose-500 text-white' };
  }
  if (score >= 5_300) {
    return { label: 'Prioridade média', className: 'bg-amber-400 text-amber-950' };
  }
  return { label: 'Prioridade baixa', className: 'bg-muted text-muted-foreground' };
};
