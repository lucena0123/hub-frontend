import axios from 'axios';
import { Copy, DollarSign, Pause, Play, RefreshCw, TrendingDown, TrendingUp, Wand2 } from 'lucide-react';

import type { ActionProposalStatus, MetricsQuery } from '@/types';
import type { GenerateActionProposalsInput } from '@/lib/api/client';

export type StatusFilter = ActionProposalStatus | 'all';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return 'Não autorizado. Cole um token JWT válido para ver/aprovar propostas.';
    if (status === 403) return 'Sem permissão. Apenas admin/manager pode gerar/aprovar/rejeitar.';

    const data = err.response?.data;
    if (isRecord(data) && typeof data.message === 'string') return data.message;
  }

  if (err instanceof Error) return err.message;
  return fallback;
};

export const statusLabel: Record<ActionProposalStatus, string> = {
  pending: 'pendente',
  approved: 'aprovado',
  rejected: 'rejeitado',
  executed: 'executado',
  expired: 'expirado',
};

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

export const buildGeneratePayload = (metricsQuery?: MetricsQuery, selectedCampaignId?: string | null): GenerateActionProposalsInput => {
  const payload: GenerateActionProposalsInput = {};
  if (metricsQuery?.period) payload.period = metricsQuery.period;
  if (metricsQuery?.startDate) payload.startDate = metricsQuery.startDate;
  if (metricsQuery?.endDate) payload.endDate = metricsQuery.endDate;
  if (selectedCampaignId) payload.campaignId = selectedCampaignId;
  return payload;
};
