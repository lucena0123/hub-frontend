'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, Copy, Loader2, Megaphone, Target, Wallet } from 'lucide-react';

import { getAlerts, getClients, listActionProposals, type ActionProposal } from '@/lib/api/client';
import { apiClient } from '@/lib/api/client/http';
import type { OptimizationRule } from '@/types/optimization';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/performance/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { Client, PerformanceAlert } from '@/types';

type OpsBucket = 'creative_copy' | 'audience' | 'budget_scale';

type OpsItem = {
  id: string;
  clientId: string;
  clientName: string;
  campaignName: string;
  creativeName: string;
  title: string;
  description: string;
  source: 'alert' | 'proposal';
  priority: 'critical' | 'warning' | 'info';
  bucket: OpsBucket;
  evidence: string;
  successCriterion: string;
  confidence: 'alta' | 'média';
  copyText: string;
  imageSuggestion: string;
  audienceSuggestion: string;
  budgetSuggestion: string;
  relatedEvidence: string[];
  analysisWindow: string;
  learningWindow: string;
  learningWindowBasis?: 'since_start' | 'since_reset' | 'mixed' | 'unknown';
};

type OpsStatus =
  | 'pendente'
  | 'em_execucao'
  | 'implementado'
  | 'validado_ganhou'
  | 'validado_neutro'
  | 'validado_piorou';

type CheckpointFilter = 'all' | 'ready24' | 'ready48' | 'pending';

type StatusHistoryEntry = { status: OpsStatus; at: string };

const DONE_KEY = 'meta-ops-done-v1';
const STATUS_KEY = 'meta-ops-status-v2';
const ROLLBACK_KEY = 'meta-ops-rule-rollback-v1';
const IMPLEMENTED_AT_KEY = 'meta-ops-implemented-at-v1';
const STATUS_HISTORY_KEY = 'meta-ops-status-history-v1';

const priorityClass: Record<OpsItem['priority'], string> = {
  critical: 'bg-destructive/15 text-destructive',
  warning: 'bg-amber-500/15 text-amber-300',
  info: 'bg-muted text-muted-foreground',
};

const confidenceClass: Record<OpsItem['confidence'], string> = {
  alta: 'bg-emerald-500/15 text-emerald-300',
  média: 'bg-amber-500/15 text-amber-300',
};

const statusLabel: Record<OpsStatus, string> = {
  pendente: 'Pendente',
  em_execucao: 'Em execução',
  implementado: 'Implementado',
  validado_ganhou: 'Validado (Ganhou)',
  validado_neutro: 'Validado (Neutro)',
  validado_piorou: 'Validado (Piorou)',
};

const statusClass: Record<OpsStatus, string> = {
  pendente: 'bg-muted text-muted-foreground',
  em_execucao: 'bg-blue-500/15 text-blue-300',
  implementado: 'bg-violet-500/15 text-violet-300',
  validado_ganhou: 'bg-emerald-500/15 text-emerald-300',
  validado_neutro: 'bg-amber-500/15 text-amber-300',
  validado_piorou: 'bg-destructive/15 text-destructive',
};

const learningBasisLabel: Record<NonNullable<OpsItem['learningWindowBasis']>, string> = {
  since_start: 'base: desde início',
  since_reset: 'base: desde reset',
  mixed: 'base: mista',
  unknown: 'base: não definida',
};

const bucketMeta: Record<OpsBucket, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  creative_copy: { title: 'Criativo & Copy', icon: Megaphone },
  audience: { title: 'Público & Segmentação', icon: Target },
  budget_scale: { title: 'Orçamento & Escala', icon: Wallet },
};

const toPriority = (type: string): OpsItem['priority'] => {
  if (type === 'critical') return 'critical';
  if (type === 'warning') return 'warning';
  return 'info';
};

const bucketFromAlert = (alert: PerformanceAlert): OpsBucket => {
  const c = alert.category;
  if (['creative', 'creative-fatigue', 'creative-video', 'creative-winner'].includes(c)) return 'creative_copy';
  if (['trend', 'contacts', 'ctr', 'qualification'].includes(c)) return 'audience';
  return 'budget_scale';
};

const bucketFromProposal = (proposal: ActionProposal): OpsBucket => {
  const action = proposal.action ?? '';
  if (['refresh', 'review', 'duplicate_adset'].includes(action)) return 'creative_copy';
  if (['track', 'sync'].includes(action)) return 'audience';
  return 'budget_scale';
};

const successCriterionByBucket = (bucket: OpsBucket) => {
  if (bucket === 'creative_copy') return 'Meta de sucesso: aumentar conversas ou CTR em até 24h.';
  if (bucket === 'audience') return 'Meta de sucesso: recuperar volume sem elevar CPL em 24h.';
  return 'Meta de sucesso: reduzir CPL ou estabilizar gasto em 24h.';
};

const inferCreativeName = (title: string, description: string) => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('criativo') || text.includes('copy') || text.includes('anúncio')) return 'Criativo principal';
  return 'Criativo a definir';
};

const windowsBySource = (
  source: OpsItem['source'],
  description: string,
  bucket?: OpsBucket,
  hinted?: {
    analysisWindow?: string;
    learningWindow?: string;
    learningWindowBasis?: 'since_start' | 'since_reset' | 'mixed' | 'unknown';
  }
) => {
  if (hinted?.analysisWindow || hinted?.learningWindow) {
    return {
      analysisWindow: hinted.analysisWindow ?? 'Acumulado (métrica consolidada da campanha)',
      learningWindow: hinted.learningWindow ?? 'Aprendizado (start/reset não explícito; validar na tela de Performance)',
      learningWindowBasis: hinted.learningWindowBasis ?? 'unknown',
    };
  }

  if (source === 'alert') {
    const hasStartResetHint = /start|reset/i.test(description);
    return {
      analysisWindow: 'Acumulado (métrica consolidada da campanha)',
      learningWindow: hasStartResetHint
        ? 'Aprendizado (start/reset explícito no dado)'
        : 'Aprendizado (start/reset não explícito; validar na tela de Performance)',
      learningWindowBasis: hasStartResetHint ? 'mixed' : 'unknown',
    };
  }

  if (source === 'proposal') {
    if (bucket === 'creative_copy') {
      return {
        analysisWindow: 'Operacional atual de criativo/copy (priorização do ciclo atual)',
        learningWindow: 'Aprendizado depende da próxima janela pós-implementação (24h/48h)',
        learningWindowBasis: 'unknown',
      };
    }

    if (bucket === 'audience') {
      return {
        analysisWindow: 'Operacional atual de segmentação (sinal do ciclo atual)',
        learningWindow: 'Aprendizado depende da próxima janela pós-ajuste de público (24h/48h)',
        learningWindowBasis: 'unknown',
      };
    }

    return {
      analysisWindow: 'Operacional atual de orçamento/escala (ciclo vigente)',
      learningWindow: 'Aprendizado depende da próxima janela pós-ajuste de verba (24h/48h)',
      learningWindowBasis: 'unknown',
    };
  }

  return {
    analysisWindow: 'Operacional atual (item de proposta)',
    learningWindow: 'Sem base de aprendizado no item; validar start/reset na tela de Performance',
    learningWindowBasis: 'unknown',
  };
};

const ruleSuggestionByBucket = (
  bucket: OpsBucket,
  priority: OpsItem['priority']
): { ruleId: string; parameters: Record<string, unknown>; rationale: string } => {
  if (bucket === 'creative_copy') {
    return {
      ruleId: 'creative.fatigued',
      parameters: {
        frequencyThreshold: priority === 'critical' ? 2.1 : 2.4,
        windowDays: 5,
      },
      rationale: 'Ajuste para detectar fadiga criativa mais cedo quando necessário.',
    };
  }

  if (bucket === 'audience') {
    return {
      ruleId: 'campaign.no-contacts',
      parameters: {
        minSpend: priority === 'critical' ? 28 : 35,
        windowDays: 2,
      },
      rationale: 'Antecipar alerta de falta de contatos para reagir no mesmo ciclo.',
    };
  }

  return {
    ruleId: 'campaign.cpl-high',
    parameters: {
      cplThreshold: priority === 'critical' ? 16 : 18,
      windowDays: 3,
    },
    rationale: 'Ajustar limiar de CPL para cortar desperdício mais cedo.',
  };
};

const buildPlaybook = (item: {
  title: string;
  priority: OpsItem['priority'];
  bucket: OpsBucket;
  clientName: string;
}) => {
  const hook = item.priority === 'critical' ? 'Ação imediata' : item.priority === 'warning' ? 'Atenção' : 'Oportunidade';
  const copyText = `${hook}: ${item.title}.\nSe isso está acontecendo com você, fale agora com nossa equipe jurídica no WhatsApp e receba orientação especializada.`;

  const imageSuggestion =
    item.bucket === 'creative_copy'
      ? 'Use vídeo vertical 9:16 com advogado(a) em câmera, texto grande no início e CTA WhatsApp no final.'
      : item.bucket === 'audience'
        ? 'Use criativo com dor específica do público + prova de autoridade (especialista + tema jurídico).'
        : 'Use criativo simples com headline de benefício e reforço de urgência (sem poluição visual).';

  const audienceSuggestion =
    item.bucket === 'audience'
      ? `Público sugerido: base ${item.clientName} + lookalike 1% de conversões + interesses jurídicos do tema da campanha.`
      : 'Público sugerido: manter conjunto atual e abrir 1 variação com interesse correlato para teste A/B.';

  const budgetSuggestion =
    item.priority === 'critical'
      ? 'Orçamento sugerido: reduzir 15% no conjunto crítico e realocar para criativo novo por 24h.'
      : item.priority === 'warning'
        ? 'Orçamento sugerido: ajuste fino de 10% (sem escalar no mesmo dia da troca criativa).'
        : 'Orçamento sugerido: manter e escalar +10% apenas se CPL/conversas melhorarem em 24h.';

  return { copyText, imageSuggestion, audienceSuggestion, budgetSuggestion };
};

export default function MetaOpsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | OpsItem['priority']>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | OpsItem['confidence']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | OpsStatus>('all');
  const [checkpointFilter, setCheckpointFilter] = useState<CheckpointFilter>('all');
  const [statusMap, setStatusMap] = useState<Record<string, OpsStatus>>({});
  const [implementedAtMap, setImplementedAtMap] = useState<Record<string, string>>({});
  const [statusHistoryMap, setStatusHistoryMap] = useState<Record<string, StatusHistoryEntry[]>>({});
  const [collapsedClientGroup, setCollapsedClientGroup] = useState<Record<string, boolean>>({});
  const [rulesByClient, setRulesByClient] = useState<Record<string, OptimizationRule[]>>({});
  const [rollbackByItem, setRollbackByItem] = useState<Record<string, { clientId: string; ruleId: string; previous: Record<string, unknown> }>>({});
  const [ruleFeedback, setRuleFeedback] = useState<string | null>(null);
  const [savingRuleItemId, setSavingRuleItemId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawStatus = localStorage.getItem(STATUS_KEY);
      if (rawStatus) {
        setStatusMap(JSON.parse(rawStatus) as Record<string, OpsStatus>);
        return;
      }

      const rawDone = localStorage.getItem(DONE_KEY);
      if (rawDone) {
        const parsed = JSON.parse(rawDone) as Record<string, boolean>;
        const migrated = Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [key, value ? 'implementado' : 'pendente'])
        ) as Record<string, OpsStatus>;
        setStatusMap(migrated);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
  }, [statusMap]);

  useEffect(() => {
    try {
      const rawImplemented = localStorage.getItem(IMPLEMENTED_AT_KEY);
      if (rawImplemented) setImplementedAtMap(JSON.parse(rawImplemented) as Record<string, string>);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(IMPLEMENTED_AT_KEY, JSON.stringify(implementedAtMap));
  }, [implementedAtMap]);

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(STATUS_HISTORY_KEY);
      if (rawHistory) setStatusHistoryMap(JSON.parse(rawHistory) as Record<string, StatusHistoryEntry[]>);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STATUS_HISTORY_KEY, JSON.stringify(statusHistoryMap));
  }, [statusHistoryMap]);

  useEffect(() => {
    try {
      const rawRollback = localStorage.getItem(ROLLBACK_KEY);
      if (rawRollback) setRollbackByItem(JSON.parse(rawRollback) as Record<string, { clientId: string; ruleId: string; previous: Record<string, unknown> }>);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ROLLBACK_KEY, JSON.stringify(rollbackByItem));
  }, [rollbackByItem]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientData, alertsData] = await Promise.all([getClients(), getAlerts()]);
        setClients(clientData);
        setAlerts(alertsData.alerts ?? []);

        const [proposalGroups, rulesGroups] = await Promise.all([
          Promise.all(
            clientData.map(async (client) => {
              try {
                const response = await listActionProposals(client.id, { limit: 50 });
                return response.proposals ?? [];
              } catch {
                return [];
              }
            })
          ),
          Promise.all(
            clientData.map(async (client) => {
              try {
                const response = await apiClient.get<OptimizationRule[]>('/api/optimization/rules', { params: { clientId: client.id } });
                return [client.id, response.data] as const;
              } catch {
                return [client.id, [] as OptimizationRule[]] as const;
              }
            })
          ),
        ]);

        setProposals(proposalGroups.flat());
        setRulesByClient(Object.fromEntries(rulesGroups));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar central de operação Meta Ads.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const checkpointStateFor = useCallback((id: string) => {
    const implementedAt = implementedAtMap[id];
    if (!implementedAt) return { ready24: false, ready48: false, pending: true };

    const elapsedHours = Math.max(0, (Date.now() - new Date(implementedAt).getTime()) / (1000 * 60 * 60));
    return {
      ready24: elapsedHours >= 24,
      ready48: elapsedHours >= 48,
      pending: elapsedHours < 24,
    };
  }, [implementedAtMap]);

  const opsItems = useMemo<OpsItem[]>(() => {
    const fromAlerts: OpsItem[] = alerts
      .filter((alert) => alert.type === 'critical' || alert.type === 'warning')
      .map((alert) => {
        const bucket = bucketFromAlert(alert);
        const priority = toPriority(alert.type);
        const playbook = buildPlaybook({
          title: alert.campaignName ?? alert.metric,
          priority,
          bucket,
          clientName: alert.clientName,
        });

        const campaignName = alert.campaignName ?? 'Campanha não identificada';
        const windows = windowsBySource('alert', alert.message, bucket, {
          analysisWindow: alert.analysisWindow,
          learningWindow: alert.learningWindow,
          learningWindowBasis: alert.learningWindowBasis,
        });
        return {
          id: `alert:${alert.id}`,
          clientId: alert.clientId,
          clientName: alert.clientName,
          campaignName,
          creativeName: inferCreativeName(campaignName, alert.message),
          title: campaignName,
          description: alert.message,
          source: 'alert',
          priority,
          bucket,
          evidence: `${alert.metric}: atual ${alert.currentValue} vs referência ${alert.threshold}`,
          successCriterion: successCriterionByBucket(bucket),
          confidence: 'alta',
          relatedEvidence: [],
          ...windows,
          ...playbook,
        };
      });

    const fromProposals: OpsItem[] = proposals
      .filter((proposal) => proposal.status === 'pending' || proposal.status === 'approved')
      .map((proposal) => {
        const bucket = bucketFromProposal(proposal);
        const priority = toPriority(proposal.severity ?? 'info');
        const clientName = proposal.clientName ?? 'Cliente';
        const title = proposal.title ?? 'Ação proposta';
        const description = proposal.description ?? `Ação sugerida: ${proposal.action ?? 'review'}`;
        const playbook = buildPlaybook({ title, priority, bucket, clientName });
        const windows = windowsBySource('proposal', description, bucket);

        return {
          id: `proposal:${proposal.proposalId}`,
          clientId: proposal.clientId,
          clientName,
          campaignName: title,
          creativeName: inferCreativeName(title, description),
          title,
          description,
          source: 'proposal',
          priority,
          bucket,
          evidence: `Proposta ${proposal.status} em ${new Date(proposal.createdAt).toLocaleString('pt-BR')}`,
          successCriterion: successCriterionByBucket(bucket),
          confidence: proposal.status === 'approved' ? 'alta' : 'média',
          relatedEvidence: [],
          ...windows,
          ...playbook,
        };
      });

    const all = [...fromAlerts, ...fromProposals];

    const priorityWeight: Record<OpsItem['priority'], number> = { critical: 3, warning: 2, info: 1 };
    const confidenceWeight: Record<OpsItem['confidence'], number> = { alta: 2, média: 1 };

    const dedupedMap = new Map<string, OpsItem>();

    all.forEach((item) => {
      const dedupeKey = [item.clientId, item.campaignName.toLowerCase(), item.bucket, item.priority].join('::');
      const existing = dedupedMap.get(dedupeKey);

      if (!existing) {
        dedupedMap.set(dedupeKey, { ...item, relatedEvidence: [...item.relatedEvidence] });
        return;
      }

      const existingScore = priorityWeight[existing.priority] * 10 + confidenceWeight[existing.confidence] + (existing.source === 'alert' ? 3 : 1);
      const incomingScore = priorityWeight[item.priority] * 10 + confidenceWeight[item.confidence] + (item.source === 'alert' ? 3 : 1);

      const mergedEvidence = Array.from(
        new Set([
          ...existing.relatedEvidence,
          `${existing.source === 'alert' ? 'Alerta' : 'Proposta'}: ${existing.evidence}`,
          `${item.source === 'alert' ? 'Alerta' : 'Proposta'}: ${item.evidence}`,
        ])
      );

      if (incomingScore > existingScore) {
        dedupedMap.set(dedupeKey, { ...item, relatedEvidence: mergedEvidence });
      } else {
        dedupedMap.set(dedupeKey, { ...existing, relatedEvidence: mergedEvidence });
      }
    });

    return Array.from(dedupedMap.values())
      .filter((item) => clientFilter === 'all' || item.clientId === clientFilter)
      .filter((item) => priorityFilter === 'all' || item.priority === priorityFilter)
      .filter((item) => confidenceFilter === 'all' || item.confidence === confidenceFilter)
      .filter((item) => statusFilter === 'all' || (statusMap[item.id] ?? 'pendente') === statusFilter)
      .filter((item) => {
        if (checkpointFilter === 'all') return true;
        const cp = checkpointStateFor(item.id);
        if (checkpointFilter === 'ready24') return cp.ready24;
        if (checkpointFilter === 'ready48') return cp.ready48;
        return cp.pending;
      })
      .sort((a, b) => {
        const pOrder = { critical: 0, warning: 1, info: 2 } as const;
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
        return a.clientName.localeCompare(b.clientName, 'pt-BR');
      });
  }, [alerts, proposals, clientFilter, priorityFilter, confidenceFilter, statusFilter, checkpointFilter, statusMap, checkpointStateFor]);

  const byBucket = useMemo(() => {
    return {
      creative_copy: opsItems.filter((i) => i.bucket === 'creative_copy'),
      audience: opsItems.filter((i) => i.bucket === 'audience'),
      budget_scale: opsItems.filter((i) => i.bucket === 'budget_scale'),
    };
  }, [opsItems]);

  const groupedByBucketClient = useMemo(() => {
    const group = (items: OpsItem[]) => {
      const map = new Map<string, { clientId: string; clientName: string; items: OpsItem[] }>();
      items.forEach((item) => {
        const current = map.get(item.clientId) ?? { clientId: item.clientId, clientName: item.clientName, items: [] };
        current.items.push(item);
        map.set(item.clientId, current);
      });

      const priorityRank: Record<OpsItem['priority'], number> = { critical: 0, warning: 1, info: 2 };

      return Array.from(map.values())
        .map((grouped) => ({
          ...grouped,
          items: grouped.items.sort((a, b) => {
            const ac = checkpointStateFor(a.id);
            const bc = checkpointStateFor(b.id);
            if (ac.ready48 !== bc.ready48) return ac.ready48 ? -1 : 1;
            if (ac.ready24 !== bc.ready24) return ac.ready24 ? -1 : 1;
            if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority];
            return a.title.localeCompare(b.title, 'pt-BR');
          }),
        }))
        .sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));
    };

    return {
      creative_copy: group(byBucket.creative_copy),
      audience: group(byBucket.audience),
      budget_scale: group(byBucket.budget_scale),
    };
  }, [byBucket, checkpointStateFor]);

  const statusMetrics = useMemo(() => {
    const counts: Record<OpsStatus, number> = {
      pendente: 0,
      em_execucao: 0,
      implementado: 0,
      validado_ganhou: 0,
      validado_neutro: 0,
      validado_piorou: 0,
    };

    opsItems.forEach((item) => {
      const status = statusMap[item.id] ?? 'pendente';
      counts[status] += 1;
    });

    return counts;
  }, [opsItems, statusMap]);

  const mandatoryValidationToday = useMemo(() => {
    return opsItems
      .filter((item) => {
        const status = statusMap[item.id] ?? 'pendente';
        if (status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou') return false;
        const cp = checkpointStateFor(item.id);
        return cp.ready24 || cp.ready48;
      })
      .sort((a, b) => {
        const aCp = checkpointStateFor(a.id);
        const bCp = checkpointStateFor(b.id);
        if (aCp.ready48 !== bCp.ready48) return aCp.ready48 ? -1 : 1;
        const pOrder = { critical: 0, warning: 1, info: 2 } as const;
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
        return a.clientName.localeCompare(b.clientName, 'pt-BR');
      })
      .slice(0, 10);
  }, [opsItems, statusMap, checkpointStateFor]);

  const hasImplementationTimestamp = (id: string) => Boolean(implementedAtMap[id]);

  const setItemStatus = (id: string, status: OpsStatus) => {
    if (
      (status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou') &&
      !hasImplementationTimestamp(id)
    ) {
      setRuleFeedback('Para validar resultado, marque primeiro como implementado (com timestamp).');
      return;
    }

    const nowIso = new Date().toISOString();
    setStatusMap((prev) => ({ ...prev, [id]: status }));
    setStatusHistoryMap((prev) => {
      const current = prev[id] ?? [];
      const last = current[current.length - 1];
      if (last?.status === status) return prev;
      return {
        ...prev,
        [id]: [...current, { status, at: nowIso }].slice(-8),
      };
    });

    if (status === 'implementado') {
      setImplementedAtMap((prev) => ({ ...prev, [id]: prev[id] ?? nowIso }));
      return;
    }

    if (status === 'pendente') {
      setImplementedAtMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validationView = (id: string, status: OpsStatus) => {
    const implementedAt = implementedAtMap[id];
    if (!implementedAt) {
      return {
        implementedAtLabel: status === 'implementado' ? 'Implementado sem data (legado)' : 'Ainda não implementado',
        checkpoint24: 'pendente',
        checkpoint48: 'pendente',
        nextCheckpoint: 'Próximo checkpoint: implementar para iniciar 24h/48h.',
      };
    }

    const implementedMs = new Date(implementedAt).getTime();
    const elapsedHours = Math.max(0, (Date.now() - implementedMs) / (1000 * 60 * 60));
    const validated = status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou';

    const checkpoint24 = validated ? 'validado' : elapsedHours >= 24 ? 'pronto para validar' : 'pendente';
    const checkpoint48 = validated ? 'validado' : elapsedHours >= 48 ? 'pronto para validar' : 'pendente';

    const nextCheckpoint = validated
      ? 'Próximo checkpoint: validação concluída.'
      : elapsedHours < 24
        ? `Próximo checkpoint: 24h em ~${Math.ceil(24 - elapsedHours)}h.`
        : elapsedHours < 48
          ? `Próximo checkpoint: 48h em ~${Math.ceil(48 - elapsedHours)}h.`
          : 'Próximo checkpoint: 24h/48h já prontos para validação.';

    return {
      implementedAtLabel: `Implementado em ${new Date(implementedAt).toLocaleString('pt-BR')}`,
      checkpoint24,
      checkpoint48,
      nextCheckpoint,
    };
  };

  const currentRuleParams = (item: OpsItem) => {
    const suggestion = ruleSuggestionByBucket(item.bucket, item.priority);
    const currentRule = (rulesByClient[item.clientId] ?? []).find((rule) => rule.id === suggestion.ruleId);
    return {
      ruleId: suggestion.ruleId,
      current: (currentRule?.parameters ?? {}) as Record<string, unknown>,
      suggested: suggestion.parameters,
      rationale: suggestion.rationale,
    };
  };

  const applyRuleSuggestion = async (item: OpsItem) => {
    const { ruleId, current, suggested } = currentRuleParams(item);
    const ok = window.confirm(`Aplicar sugestão de regra para ${item.clientName}?\n\nRegra: ${ruleId}`);
    if (!ok) return;

    try {
      setSavingRuleItemId(item.id);
      await apiClient.post(`/api/optimization/rules/${ruleId}/config`, {
        clientId: item.clientId,
        parameters: suggested,
      });

      setRulesByClient((prev) => ({
        ...prev,
        [item.clientId]: (prev[item.clientId] ?? []).map((rule) =>
          rule.id === ruleId ? { ...rule, parameters: suggested } : rule
        ),
      }));

      setRollbackByItem((prev) => ({
        ...prev,
        [item.id]: { clientId: item.clientId, ruleId, previous: current },
      }));

      setRuleFeedback(`Regra ${ruleId} atualizada para ${item.clientName}.`);
    } catch {
      setRuleFeedback(`Falha ao atualizar regra ${ruleId}.`);
    } finally {
      setSavingRuleItemId(null);
    }
  };

  const rollbackRuleSuggestion = async (item: OpsItem) => {
    const rollback = rollbackByItem[item.id];
    if (!rollback) return;

    const ok = window.confirm(`Reverter ajuste da regra ${rollback.ruleId} para ${item.clientName}?`);
    if (!ok) return;

    try {
      setSavingRuleItemId(item.id);
      await apiClient.post(`/api/optimization/rules/${rollback.ruleId}/config`, {
        clientId: rollback.clientId,
        parameters: rollback.previous,
      });

      setRulesByClient((prev) => ({
        ...prev,
        [rollback.clientId]: (prev[rollback.clientId] ?? []).map((rule) =>
          rule.id === rollback.ruleId ? { ...rule, parameters: rollback.previous } : rule
        ),
      }));

      setRollbackByItem((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setRuleFeedback(`Rollback aplicado na regra ${rollback.ruleId}.`);
    } catch {
      setRuleFeedback(`Falha ao aplicar rollback da regra ${rollback.ruleId}.`);
    } finally {
      setSavingRuleItemId(null);
    }
  };

  const toggleClientGroup = (key: string) => {
    setCollapsedClientGroup((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyField = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
    } catch {
      setCopiedKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Meta Ads / Operação"
      title="Central de Implementação"
      description="Tela única com recomendações baseadas em evidência interna para executar no Meta Ads."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {opsItems.length}</div>
          <div className="signal-chip">Pendentes {statusMetrics.pendente}</div>
          <div className="signal-chip">Em execução {statusMetrics.em_execucao}</div>
          <div className="signal-chip">Implementados {statusMetrics.implementado}</div>
          <div className="signal-chip">Validados ✅ {statusMetrics.validado_ganhou}</div>
          <div className="signal-chip">Validados ➖ {statusMetrics.validado_neutro}</div>
          <div className="signal-chip">Validados ⛔ {statusMetrics.validado_piorou}</div>
          <div className="signal-chip">Prontos 24h {opsItems.filter((i) => checkpointStateFor(i.id).ready24).length}</div>
          <div className="signal-chip">Prontos 48h {opsItems.filter((i) => checkpointStateFor(i.id).ready48).length}</div>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm">Como usar (assistido)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">1) Filtre cliente e priorize itens críticos.</div>
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">2) Abra a tela alvo (Performance/Board/Regras) e implemente no Meta Ads.</div>
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">3) Marque como implementado e valide resultado em 24h e 48h.</div>
          </CardContent>
        </Card>

        {ruleFeedback ? (
          <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">{ruleFeedback}</div>
        ) : null}

        <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs font-medium text-amber-200">Ações obrigatórias de validação (24h/48h)</p>
          {mandatoryValidationToday.length === 0 ? (
            <p className="text-xs text-amber-100/80">Sem ações obrigatórias no momento.</p>
          ) : (
            <div className="grid gap-1">
              {mandatoryValidationToday.map((item) => {
                const cp = checkpointStateFor(item.id);
                return (
                  <p key={`must:${item.id}`} className="text-xs text-amber-100/90">
                    • {cp.ready48 ? '[48h]' : '[24h]'} {item.clientName} · {item.campaignName}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 flex flex-wrap items-center gap-2">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="all">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | OpsItem['priority'])}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="all">Prioridade: todas</option>
            <option value="critical">Prioridade: critical</option>
            <option value="warning">Prioridade: warning</option>
          </select>

          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value as 'all' | OpsItem['confidence'])}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="all">Confiança: todas</option>
            <option value="alta">Confiança: alta</option>
            <option value="média">Confiança: média</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OpsStatus)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="all">Status: todos</option>
            <option value="pendente">Pendente</option>
            <option value="em_execucao">Em execução</option>
            <option value="implementado">Implementado</option>
            <option value="validado_ganhou">Validado (ganhou)</option>
            <option value="validado_neutro">Validado (neutro)</option>
            <option value="validado_piorou">Validado (piorou)</option>
          </select>

          <select
            value={checkpointFilter}
            onChange={(e) => setCheckpointFilter(e.target.value as CheckpointFilter)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="all">Checkpoint: todos</option>
            <option value="pending">Checkpoint: pendente</option>
            <option value="ready24">Checkpoint: pronto 24h</option>
            <option value="ready48">Checkpoint: pronto 48h</option>
          </select>

          <Button asChild variant="outline" size="sm"><Link href="/summary">Resumo</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/alerts">Alertas</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/tasks">Tarefas</Link></Button>
        </div>

        {(Object.keys(bucketMeta) as OpsBucket[]).map((bucket) => {
          const Icon = bucketMeta[bucket].icon;
          const groups = groupedByBucketClient[bucket];

          return (
            <div key={bucket} className="space-y-3">
              <SectionHeader
                title={bucketMeta[bucket].title}
                subtitle="Sugestões agrupadas por tipo de implementação"
                icon={Icon}
              />

              {groups.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">Sem itens neste grupo para o filtro atual.</CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => {
                    const groupKey = `${bucket}:${group.clientId}`;
                    const isCollapsed = collapsedClientGroup[groupKey] ?? false;

                    return (
                    <Card key={groupKey} className="border-primary/20">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm">Cliente: {group.clientName}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Itens {group.items.length}</Badge>
                            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => toggleClientGroup(groupKey)}>
                              {isCollapsed ? 'Mostrar' : 'Ocultar'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {isCollapsed ? (
                          <div className="text-xs text-muted-foreground">Grupo oculto para reduzir ruído visual.</div>
                        ) : group.items.map((item) => {
                          const checkpointState = checkpointStateFor(item.id);
                          const checkpointBadge = checkpointState.ready48 ? 'Pronto 48h' : checkpointState.ready24 ? 'Pronto 24h' : 'Checkpoint pendente';
                          const checkpointClass = checkpointState.ready48
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : checkpointState.ready24
                              ? 'border-amber-500/40 bg-amber-500/5'
                              : 'border-border/50 bg-card/40';

                          return (
                          <div key={item.id} className={`rounded-md border ${checkpointClass} p-3 space-y-2`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-medium">{item.title}</div>
                              <div className="flex items-center gap-2">
                                <Badge className={priorityClass[item.priority]}>{item.priority}</Badge>
                                <Badge className={confidenceClass[item.confidence]}>confiança {item.confidence}</Badge>
                                <Badge className={statusClass[(statusMap[item.id] ?? 'pendente')]}>{statusLabel[statusMap[item.id] ?? 'pendente']}</Badge>
                                <Badge variant="outline">{checkpointBadge}</Badge>
                                <Badge variant="outline">{item.source === 'alert' ? 'Alerta' : 'Proposta'}</Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <Badge variant="outline">Campanha: {item.campaignName}</Badge>
                              <Badge variant="outline">Criativo: {item.creativeName}</Badge>
                              <Badge variant="outline">{learningBasisLabel[item.learningWindowBasis ?? 'unknown']}</Badge>
                            </div>

                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <div className="rounded-md border border-border/50 bg-background/60 p-2 text-[11px] text-muted-foreground space-y-1">
                              <p><strong className="text-foreground/80">Evidência principal:</strong> {item.evidence}</p>
                              {item.relatedEvidence.length > 1 ? (
                                <p><strong className="text-foreground/80">Evidências relacionadas:</strong> {item.relatedEvidence.length - 1}</p>
                              ) : null}
                              <p><strong className="text-foreground/80">Janela de análise:</strong> {item.analysisWindow}</p>
                              <p><strong className="text-foreground/80">Janela de aprendizado:</strong> {item.learningWindow}</p>
                              <p><strong className="text-foreground/80">Critério de sucesso:</strong> {item.successCriterion}</p>
                              <p>
                                <strong className="text-foreground/80">Próximo checkpoint:</strong>{' '}
                                {validationView(item.id, statusMap[item.id] ?? 'pendente').nextCheckpoint}
                              </p>
                            </div>

                            <div className="rounded-md border border-border/50 bg-muted/20 p-2 text-[11px] text-muted-foreground space-y-1">
                              <p><strong className="text-foreground/80">Validação 24h:</strong> {validationView(item.id, statusMap[item.id] ?? 'pendente').checkpoint24}</p>
                              <p><strong className="text-foreground/80">Validação 48h:</strong> {validationView(item.id, statusMap[item.id] ?? 'pendente').checkpoint48}</p>
                              <p><strong className="text-foreground/80">Implementação:</strong> {validationView(item.id, statusMap[item.id] ?? 'pendente').implementedAtLabel}</p>
                            </div>

                            <div className="rounded-md border border-border/50 bg-muted/20 p-2 text-[11px] text-muted-foreground space-y-1">
                              <p><strong className="text-foreground/80">Trilha de status (recente):</strong></p>
                              {(statusHistoryMap[item.id] ?? []).length === 0 ? (
                                <p>Sem movimentação registrada ainda.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {(statusHistoryMap[item.id] ?? []).slice().reverse().map((entry, idx) => (
                                    <li key={`${item.id}:history:${idx}`}>• {statusLabel[entry.status]} — {new Date(entry.at).toLocaleString('pt-BR')}</li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="grid gap-2 text-[11px]">
                              <div className="rounded-md border border-border/50 bg-muted/20 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-foreground/90">Copy (copia e cola)</p>
                                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => void copyField(`${item.id}:copy`, item.copyText)}>
                                    <Copy className="h-3 w-3 mr-1" /> {copiedKey === `${item.id}:copy` ? 'Copiado' : 'Copiar'}
                                  </Button>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap">{item.copyText}</p>
                              </div>

                              <div className="rounded-md border border-border/50 bg-muted/20 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-foreground/90">Imagem/Vídeo sugerido</p>
                                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => void copyField(`${item.id}:image`, item.imageSuggestion)}>
                                    <Copy className="h-3 w-3 mr-1" /> {copiedKey === `${item.id}:image` ? 'Copiado' : 'Copiar'}
                                  </Button>
                                </div>
                                <p className="text-muted-foreground">{item.imageSuggestion}</p>
                              </div>

                              <div className="rounded-md border border-border/50 bg-muted/20 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-foreground/90">Público sugerido</p>
                                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => void copyField(`${item.id}:audience`, item.audienceSuggestion)}>
                                    <Copy className="h-3 w-3 mr-1" /> {copiedKey === `${item.id}:audience` ? 'Copiado' : 'Copiar'}
                                  </Button>
                                </div>
                                <p className="text-muted-foreground">{item.audienceSuggestion}</p>
                              </div>

                              <div className="rounded-md border border-border/50 bg-muted/20 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-foreground/90">Orçamento sugerido</p>
                                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => void copyField(`${item.id}:budget`, item.budgetSuggestion)}>
                                    <Copy className="h-3 w-3 mr-1" /> {copiedKey === `${item.id}:budget` ? 'Copiado' : 'Copiar'}
                                  </Button>
                                </div>
                                <p className="text-muted-foreground">{item.budgetSuggestion}</p>
                              </div>
                            </div>

                            {(() => {
                              const ruleView = currentRuleParams(item);
                              return (
                                <div className="rounded-md border border-border/50 bg-background/60 p-2 text-[11px] space-y-2">
                                  <p className="font-medium text-foreground/90">Sugestão de atualização de regra ({ruleView.ruleId})</p>
                                  <p className="text-muted-foreground">{ruleView.rationale}</p>
                                  <p className="text-muted-foreground"><strong className="text-foreground/80">Atual:</strong> {JSON.stringify(ruleView.current)}</p>
                                  <p className="text-muted-foreground"><strong className="text-foreground/80">Sugerido:</strong> {JSON.stringify(ruleView.suggested)}</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px]"
                                      disabled={savingRuleItemId === item.id || clientFilter === 'all'}
                                      onClick={() => void applyRuleSuggestion(item)}
                                    >
                                      Aplicar sugestão
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px]"
                                      disabled={savingRuleItemId === item.id || !rollbackByItem[item.id]}
                                      onClick={() => void rollbackRuleSuggestion(item)}
                                    >
                                      Rollback
                                    </Button>
                                  </div>
                                  {clientFilter === 'all' ? (
                                    <p className="text-[10px] text-amber-300">Selecione um cliente no filtro para habilitar aplicação de regra.</p>
                                  ) : null}
                                </div>
                              );
                            })()}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                                <Link href={`/clients/${item.clientId}/performance`}>Diagnóstico</Link>
                              </Button>
                              <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                                <Link href={`/optimization/settings?clientId=${item.clientId}`}>Regras</Link>
                              </Button>
                              <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                                <Link href={`/optimization/board?clientId=${item.clientId}`}>Board</Link>
                              </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Button size="sm" className="h-7 text-[10px]" variant="outline" onClick={() => setItemStatus(item.id, 'pendente')}>
                                Pendente
                              </Button>
                              <Button size="sm" className="h-7 text-[10px]" variant="outline" onClick={() => setItemStatus(item.id, 'em_execucao')}>
                                Em execução
                              </Button>
                              <Button size="sm" className="h-7 text-[10px]" variant="outline" onClick={() => setItemStatus(item.id, 'implementado')}>
                                <ClipboardCheck className="h-3 w-3 mr-1" /> Implementado
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[10px]"
                                variant="outline"
                                disabled={!hasImplementationTimestamp(item.id)}
                                onClick={() => setItemStatus(item.id, 'validado_ganhou')}
                              >
                                Validou: ganhou
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[10px]"
                                variant="outline"
                                disabled={!hasImplementationTimestamp(item.id)}
                                onClick={() => setItemStatus(item.id, 'validado_neutro')}
                              >
                                Validou: neutro
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[10px]"
                                variant="outline"
                                disabled={!hasImplementationTimestamp(item.id)}
                                onClick={() => setItemStatus(item.id, 'validado_piorou')}
                              >
                                Validou: piorou
                              </Button>
                            </div>
                          </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Esta central é assistida e orientada por evidência interna (alertas e propostas). Benchmark externo é apenas insumo, não decisão final.
        </div>
      </div>
    </PageShell>
  );
}
