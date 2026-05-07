import type { ActionProposal } from '@/lib/api/client';
import type { PerformanceAlert } from '@/types';
import type { OpsBucket, OpsItem } from './types';

export const toPriority = (type: string): OpsItem['priority'] => {
  if (type === 'critical') return 'critical';
  if (type === 'warning') return 'warning';
  return 'info';
};

export const bucketFromAlert = (alert: PerformanceAlert): OpsBucket => {
  const c = alert.category;
  if (['creative', 'creative-fatigue', 'creative-video', 'creative-winner'].includes(c)) return 'creative_copy';
  if (['trend', 'contacts', 'ctr', 'qualification'].includes(c)) return 'audience';
  return 'budget_scale';
};

export const bucketFromProposal = (proposal: ActionProposal): OpsBucket => {
  const action = proposal.action ?? '';
  if (['refresh', 'review', 'duplicate_adset'].includes(action)) return 'creative_copy';
  if (['track', 'sync'].includes(action)) return 'audience';
  return 'budget_scale';
};

export const successCriterionByBucket = (bucket: OpsBucket) => {
  if (bucket === 'creative_copy') return 'Meta de sucesso: aumentar conversas ou CTR em até 24h.';
  if (bucket === 'audience') return 'Meta de sucesso: recuperar volume sem elevar CPL em 24h.';
  return 'Meta de sucesso: reduzir CPL ou estabilizar gasto em 24h.';
};

export const inferCreativeName = (title: string, description: string) => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('criativo') || text.includes('copy') || text.includes('anúncio')) return 'Criativo principal';
  return 'Criativo a definir';
};

export const normalizeLearningWindowBasis = (
  value: unknown,
): OpsItem['learningWindowBasis'] => {
  if (value === 'since_start' || value === 'since_reset' || value === 'mixed' || value === 'unknown') {
    return value;
  }
  return undefined;
};
