import type { LearningSummary } from '@/types';

export type RankingKind = 'quality' | 'engagement' | 'conversion';

const rankingContext: Record<RankingKind, { label: string; description: string }> = {
  quality: { label: 'Qualidade do anúncio', description: 'feedback negativo e percepção de qualidade' },
  engagement: { label: 'Engajamento esperado', description: 'chance de engajamento com o criativo' },
  conversion: { label: 'Conversão esperada', description: 'chance de conversão após o clique' },
};

export const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export const formatOptionalCurrency = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export const formatPercent = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(1)}%`;
};

export const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

export const getRankingMeta = (value?: string | null, kind: RankingKind = 'quality') => {
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

export const resolveLearningBadge = (summary?: LearningSummary | null) => {
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

export const formatLearningValue = (value: number | null) => {
  if (!Number.isFinite(value ?? NaN) || (value ?? 0) <= 0) return '—';
  return formatOptionalCurrency(value ?? 0);
};

export const buildLearningRows = (summary?: LearningSummary | null) => {
  if (!summary) return [];

  const statusLine = `${summary.statusCounts.learning} learning · ${summary.statusCounts.limited} limitado`;
  const eventsLine = `${summary.totalEventsInWindow.toLocaleString('pt-BR')} ${summary.eventLabel}`;
  const targetLine = `${summary.adsetsMeetingTarget}/${summary.adsetCount} ≥ ${summary.eventTarget}`;
  const budgetLine = `${formatLearningValue(summary.budgetDailyAverage)} · necessário ${formatLearningValue(summary.budgetDailyRequired)}`;

  const anchorLabel =
    summary.windowBasis === 'since_start'
      ? 'Desde início'
      : summary.windowBasis === 'since_reset'
        ? 'Desde reset'
        : summary.windowBasis === 'mixed'
          ? 'Misto (início/reset)'
          : 'Sem âncora';

  const anchorCoverage = summary.dataCoverage.withStartAnchor ?? 0;

  return [
    { label: 'Ad sets', value: `${summary.adsetCount} (${statusLine})` },
    { label: 'Janela (7d)', value: `${anchorLabel} | ${targetLine}` },
    { label: 'Eventos da janela', value: eventsLine },
    { label: 'Budget diário', value: budgetLine },
    {
      label: 'Cobertura',
      value: `${anchorCoverage}/${summary.adsetCount} com âncora · ${summary.dataCoverage.withBudgetData}/${summary.adsetCount} com budget`,
    },
  ];
};
