import axios from 'axios';
import {
  AlertTriangle,
  Copy,
  DollarSign,
  Lightbulb,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wand2,
} from 'lucide-react';

import type {
  ActionHistoryItem,
  ActionProposalStatus,
  OptimizationCenterResponse,
  OptimizationCenterSeverity,
} from '@/types';

export type Tab = 'recommendations' | 'queue' | 'history';

export const severityIcon: Record<OptimizationCenterSeverity, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  info: Sparkles,
};

export const severityLabel: Record<OptimizationCenterSeverity, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  opportunity: 'Oportunidade',
  info: 'Info',
};

export const severityColor: Record<OptimizationCenterSeverity, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  opportunity: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
};

export const severityBorder: Record<OptimizationCenterSeverity, string> = {
  critical: 'border-l-rose-500',
  warning: 'border-l-amber-400',
  opportunity: 'border-l-emerald-500',
  info: 'border-l-slate-300',
};

export const EMPTY_ITEMS: OptimizationCenterResponse['items'] = [];

export const actionIconMap: Record<string, typeof Wand2> = {
  pause: Pause,
  scale: TrendingUp,
  refresh: RefreshCw,
  pause_campaign: Pause,
  activate_campaign: Play,
  pause_adset: Pause,
  activate_adset: Play,
  reduce_budget: TrendingDown,
  set_budget: DollarSign,
  duplicate_adset: Copy,
};

export const actionLabelMap: Record<string, string> = {
  pause: 'Pausar criativo',
  scale: 'Escalar campanha',
  refresh: 'Renovar criativo',
  review: 'Revisar',
  track: 'Acompanhar',
  sync: 'Sincronizar dados',
  pause_campaign: 'Pausar campanha',
  activate_campaign: 'Ativar campanha',
  pause_adset: 'Pausar conjunto',
  activate_adset: 'Ativar conjunto',
  reduce_budget: 'Reduzir budget',
  set_budget: 'Ajustar budget',
  duplicate_adset: 'Duplicar conjunto',
};

export const statusBadgeClass: Record<ActionProposalStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-900',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
  executed: 'border-primary/30 bg-primary/10 text-primary',
  expired: 'border-slate-200 bg-slate-50 text-slate-700',
};

export const statusLabel: Record<ActionProposalStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  executed: 'Executado',
  expired: 'Expirado',
};

export const executionStatusLabel: Record<string, string> = {
  success: 'Sucesso',
  failed: 'Falhou',
  running: 'Executando',
  queued: 'Na fila',
};

export const executionStatusClass: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-200 bg-rose-50 text-rose-800',
  running: 'border-primary/30 bg-primary/10 text-primary',
  queued: 'border-slate-200 bg-slate-50 text-slate-700',
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

export const getApiError = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;
    if (s === 401) return 'Não autorizado. Token JWT inválido.';
    if (s === 403) return 'Sem permissão para esta ação.';
    const d = err.response?.data;
    if (isRecord(d) && typeof d.message === 'string') return d.message;
  }
  return err instanceof Error ? err.message : fallback;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value) || value === 0) return null;
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export const buildHistorySummary = (item: ActionHistoryItem) => {
  const meta = item.metaResponse as Record<string, unknown> | null;
  if (!meta || typeof meta !== 'object') return null;

  const from = typeof meta.from === 'number'
    ? meta.from
    : typeof meta.currentBudget === 'number'
      ? meta.currentBudget
      : null;
  const to = typeof meta.to === 'number'
    ? meta.to
    : typeof meta.nextBudget === 'number'
      ? meta.nextBudget
      : typeof meta.amount === 'number'
        ? meta.amount
        : null;

  if (from != null && to != null) {
    const fromLabel = formatCurrency(from);
    const toLabel = formatCurrency(to);
    if (fromLabel && toLabel) return `Budget: ${fromLabel} → ${toLabel}`;
  }

  if (to != null) {
    const toLabel = formatCurrency(to);
    if (toLabel) return `Budget definido: ${toLabel}`;
  }

  if (typeof meta.operation === 'string') {
    return `Operação: ${meta.operation}`;
  }

  return null;
};
