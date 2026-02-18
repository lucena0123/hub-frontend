'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, Loader2, Megaphone, Target, Wallet } from 'lucide-react';

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
};

const DONE_KEY = 'meta-ops-done-v1';

const priorityClass: Record<OpsItem['priority'], string> = {
  critical: 'bg-destructive/15 text-destructive',
  warning: 'bg-amber-500/15 text-amber-300',
  info: 'bg-muted text-muted-foreground',
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

export default function MetaOpsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});

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
    const fromAlerts: OpsItem[] = alerts.map((alert) => ({
      id: `alert:${alert.id}`,
      clientId: alert.clientId,
      clientName: alert.clientName,
      title: alert.campaignName ?? alert.metric,
      description: alert.message,
      source: 'alert',
      priority: toPriority(alert.type),
      bucket: bucketFromAlert(alert),
    }));

    const fromProposals: OpsItem[] = proposals
      .filter((proposal) => proposal.status === 'pending' || proposal.status === 'approved')
      .map((proposal) => ({
        id: `proposal:${proposal.proposalId}`,
        clientId: proposal.clientId,
        clientName: proposal.clientName ?? 'Cliente',
        title: proposal.title ?? 'Ação proposta',
        description: proposal.description ?? `Ação sugerida: ${proposal.action ?? 'review'}`,
        source: 'proposal',
        priority: toPriority(proposal.severity ?? 'info'),
        bucket: bucketFromProposal(proposal),
      }));

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
      description="Tela única para buscar sugestões, executar no Meta Ads e marcar implementação."
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
                            <Badge variant="outline">{item.source === 'alert' ? 'Alerta' : 'Proposta'}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.clientName} · {item.description}</p>
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
          Esta central é assistida: ela organiza o que implementar no Meta Ads e registra o checklist operacional.
        </div>
      </div>
    </PageShell>
  );
}
