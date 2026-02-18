'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, Copy, Loader2, Megaphone, Target, Wallet } from 'lucide-react';

import { getAlerts, getClients, listActionProposals, type ActionProposal } from '@/lib/api/client';
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
};

const DONE_KEY = 'meta-ops-done-v1';

const priorityClass: Record<OpsItem['priority'], string> = {
  critical: 'bg-destructive/15 text-destructive',
  warning: 'bg-amber-500/15 text-amber-300',
  info: 'bg-muted text-muted-foreground',
};

const confidenceClass: Record<OpsItem['confidence'], string> = {
  alta: 'bg-emerald-500/15 text-emerald-300',
  média: 'bg-amber-500/15 text-amber-300',
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
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DONE_KEY);
      if (raw) setDoneMap(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DONE_KEY, JSON.stringify(doneMap));
  }, [doneMap]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientData, alertsData] = await Promise.all([getClients(), getAlerts()]);
        setClients(clientData);
        setAlerts(alertsData.alerts ?? []);

        const proposalGroups = await Promise.all(
          clientData.map(async (client) => {
            try {
              const response = await listActionProposals(client.id, { limit: 50 });
              return response.proposals ?? [];
            } catch {
              return [];
            }
          })
        );

        setProposals(proposalGroups.flat());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar central de operação Meta Ads.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

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

        return {
          id: `alert:${alert.id}`,
          clientId: alert.clientId,
          clientName: alert.clientName,
          title: alert.campaignName ?? alert.metric,
          description: alert.message,
          source: 'alert',
          priority,
          bucket,
          evidence: `${alert.metric}: atual ${alert.currentValue} vs referência ${alert.threshold}`,
          successCriterion: successCriterionByBucket(bucket),
          confidence: 'alta',
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
        const playbook = buildPlaybook({ title, priority, bucket, clientName });

        return {
          id: `proposal:${proposal.proposalId}`,
          clientId: proposal.clientId,
          clientName,
          title,
          description: proposal.description ?? `Ação sugerida: ${proposal.action ?? 'review'}`,
          source: 'proposal',
          priority,
          bucket,
          evidence: `Proposta ${proposal.status} em ${new Date(proposal.createdAt).toLocaleString('pt-BR')}`,
          successCriterion: successCriterionByBucket(bucket),
          confidence: proposal.status === 'approved' ? 'alta' : 'média',
          ...playbook,
        };
      });

    const all = [...fromAlerts, ...fromProposals];

    return all
      .filter((item) => clientFilter === 'all' || item.clientId === clientFilter)
      .sort((a, b) => {
        const pOrder = { critical: 0, warning: 1, info: 2 } as const;
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
        return a.clientName.localeCompare(b.clientName, 'pt-BR');
      });
  }, [alerts, proposals, clientFilter]);

  const byBucket = useMemo(() => {
    return {
      creative_copy: opsItems.filter((i) => i.bucket === 'creative_copy'),
      audience: opsItems.filter((i) => i.bucket === 'audience'),
      budget_scale: opsItems.filter((i) => i.bucket === 'budget_scale'),
    };
  }, [opsItems]);

  const doneCount = useMemo(() => opsItems.filter((item) => doneMap[item.id]).length, [opsItems, doneMap]);

  const toggleDone = (id: string) => {
    setDoneMap((prev) => ({ ...prev, [id]: !prev[id] }));
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
          <div className="signal-chip">Itens {opsItems.length}</div>
          <div className="signal-chip">Implementados {doneCount}</div>
          <div className="signal-chip">Pendentes {Math.max(0, opsItems.length - doneCount)}</div>
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
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">3) Marque como implementado e valide resultado em 24h.</div>
          </CardContent>
        </Card>

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
          <Button asChild variant="outline" size="sm"><Link href="/summary">Resumo</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/alerts">Alertas</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/tasks">Tarefas</Link></Button>
        </div>

        {(Object.keys(bucketMeta) as OpsBucket[]).map((bucket) => {
          const Icon = bucketMeta[bucket].icon;
          const items = byBucket[bucket];

          return (
            <div key={bucket} className="space-y-3">
              <SectionHeader
                title={bucketMeta[bucket].title}
                subtitle="Sugestões agrupadas por tipo de implementação"
                icon={Icon}
              />

              {items.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">Sem itens neste grupo para o filtro atual.</CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium">{item.title}</div>
                          <div className="flex items-center gap-2">
                            <Badge className={priorityClass[item.priority]}>{item.priority}</Badge>
                            <Badge className={confidenceClass[item.confidence]}>confiança {item.confidence}</Badge>
                            <Badge variant="outline">{item.source === 'alert' ? 'Alerta' : 'Proposta'}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.clientName} · {item.description}</p>
                        <div className="rounded-md border border-border/50 bg-background/60 p-2 text-[11px] text-muted-foreground space-y-1">
                          <p><strong className="text-foreground/80">Evidência:</strong> {item.evidence}</p>
                          <p><strong className="text-foreground/80">Critério de sucesso:</strong> {item.successCriterion}</p>
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
                          <Button
                            size="sm"
                            className="h-7 text-[10px]"
                            variant={doneMap[item.id] ? 'secondary' : 'default'}
                            onClick={() => toggleDone(item.id)}
                          >
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            {doneMap[item.id] ? 'Implementado' : 'Marcar implementado'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
