import { Megaphone, Target, Wallet, type LucideIcon } from 'lucide-react';

import type { OpsBucket, OpsItem, OpsStatus } from './types';

export const DONE_KEY = 'meta-ops-done-v1';
export const STATUS_KEY = 'meta-ops-status-v2';
export const ROLLBACK_KEY = 'meta-ops-rule-rollback-v1';
export const IMPLEMENTED_AT_KEY = 'meta-ops-implemented-at-v1';
export const STATUS_HISTORY_KEY = 'meta-ops-status-history-v1';

export const priorityClass: Record<OpsItem['priority'], string> = {
  critical: 'bg-destructive/15 text-destructive',
  warning: 'bg-amber-500/15 text-amber-300',
  info: 'bg-muted text-muted-foreground',
};

export const confidenceClass: Record<OpsItem['confidence'], string> = {
  alta: 'bg-emerald-500/15 text-emerald-300',
  média: 'bg-amber-500/15 text-amber-300',
};

export const statusLabel: Record<OpsStatus, string> = {
  pendente: 'Pendente',
  em_execucao: 'Em execução',
  implementado: 'Implementado',
  validado_ganhou: 'Validado (Ganhou)',
  validado_neutro: 'Validado (Neutro)',
  validado_piorou: 'Validado (Piorou)',
};

export const statusClass: Record<OpsStatus, string> = {
  pendente: 'bg-muted text-muted-foreground',
  em_execucao: 'bg-blue-500/15 text-blue-300',
  implementado: 'bg-violet-500/15 text-violet-300',
  validado_ganhou: 'bg-emerald-500/15 text-emerald-300',
  validado_neutro: 'bg-amber-500/15 text-amber-300',
  validado_piorou: 'bg-destructive/15 text-destructive',
};

export const learningBasisLabel: Record<NonNullable<OpsItem['learningWindowBasis']>, string> = {
  since_start: 'base: desde início',
  since_reset: 'base: desde reset',
  mixed: 'base: mista',
  unknown: 'base: não definida',
};

export const bucketMeta: Record<OpsBucket, { title: string; icon: LucideIcon }> = {
  creative_copy: { title: 'Criativo & Copy', icon: Megaphone },
  audience: { title: 'Público & Segmentação', icon: Target },
  budget_scale: { title: 'Orçamento & Escala', icon: Wallet },
};
