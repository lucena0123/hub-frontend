import type { OptimizationCenterCategory, OptimizationCenterSeverity } from '@/types';

export const severityLabel: Record<OptimizationCenterSeverity, string> = {
  critical: 'crítico',
  warning: 'atenção',
  opportunity: 'oportunidade',
  info: 'info',
};

export const severityBadgeClass: Record<OptimizationCenterSeverity, string> = {
  critical: 'bg-rose-500 text-white border-rose-600',
  warning: 'bg-amber-400 text-amber-950 border-amber-500',
  opportunity: 'bg-emerald-500 text-white border-emerald-600',
  info: 'bg-muted text-muted-foreground border-border',
};

export const categoryLabel: Record<OptimizationCenterCategory, string> = {
  campaign: 'campanha',
  creative: 'criativo',
  adset: 'conjunto',
  qualification: 'qualificação',
  data: 'dados',
};
