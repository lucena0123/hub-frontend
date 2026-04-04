'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { HeartPulse, Plus, RefreshCw, TrendingUp } from 'lucide-react';

import {
  createExpansionOpportunity,
  getClients,
  listExpansionOpportunities,
  listHealthPortfolio,
  type ExpansionOpportunity,
  type HealthSnapshot,
} from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Client } from '@/types';
import { formatDate } from '@/lib/utils';

const statusClass: Record<HealthSnapshot['status'], string> = {
  onboarding: 'bg-primary/15 text-primary',
  healthy: 'bg-emerald-500/15 text-emerald-300',
  risk: 'bg-destructive/15 text-destructive',
  renewal: 'bg-amber-500/15 text-amber-300',
  churned: 'bg-muted text-muted-foreground',
};

const initialForm = {
  clientId: '',
  title: '',
  estimatedMrr: '',
  notes: '',
};

export default function CustomerSuccessPortfolioPage() {
  const [portfolio, setPortfolio] = useState<HealthSnapshot[]>([]);
  const [expansions, setExpansions] = useState<ExpansionOpportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nextPortfolio, nextExpansions, nextClients] = await Promise.all([
        listHealthPortfolio(),
        listExpansionOpportunities(),
        getClients(),
      ]);
      setPortfolio(nextPortfolio);
      setExpansions(nextExpansions);
      setClients(nextClients);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar portfolio de CS'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const summary = useMemo(() => ({
    total: portfolio.length,
    healthy: portfolio.filter((item) => item.status === 'healthy').length,
    risk: portfolio.filter((item) => item.status === 'risk').length,
    renewals: portfolio.filter((item) => item.status === 'renewal').length,
  }), [portfolio]);

  const handleCreateExpansion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createExpansionOpportunity({
        clientId: form.clientId,
        title: form.title,
        notes: form.notes || null,
        estimatedMrr: form.estimatedMrr ? Number(form.estimatedMrr) : null,
      });
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao criar oportunidade de expansão'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Customer Success' }, { label: 'Portfolio' }]}
      title="Portfolio de Saúde"
      description="CS acompanha onboarding, sinais de risco, renovação e expansão a partir do cliente como pivô."
      meta={(
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Contas {summary.total}</div>
          <div className="signal-chip">Saudáveis {summary.healthy}</div>
          <div className="signal-chip">Em risco {summary.risk}</div>
          <div className="signal-chip">Renovação {summary.renewals}</div>
        </div>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cs/onboarding">Onboarding</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/cs/renewals">Renovações</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      )}
    >
      <div className="space-y-8">
        {error && (
          <Reveal>
            <div className="edge-card border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
          </Reveal>
        )}

        <SectionHeader
          title="Health score"
          subtitle="Score diário combinado com inadimplência, bloqueios de entrega e onboarding pendente."
          icon={HeartPulse}
        />

        <Reveal delayMs={80}>
          {loading ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando portfolio...</div>
          ) : portfolio.length === 0 ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Nenhuma conta ativa apareceu no portfolio ainda.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {portfolio.map((snapshot) => (
                <div key={snapshot.id} className="edge-card hover-lift p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[snapshot.status]}>{snapshot.status}</Badge>
                        <Badge variant="outline">Score {snapshot.score}</Badge>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{snapshot.client.name}</p>
                        <p className="text-sm text-muted-foreground">{snapshot.contract?.title ?? 'Sem contrato associado'}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${snapshot.clientId}`}>Cliente</Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Snapshot</p>
                      <p className="text-sm">{formatDate(snapshot.snapshotDate, 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sinais</p>
                      <p className="text-sm">{snapshot.signals.length}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {snapshot.signals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum sinal crítico para esta conta.</p>
                    ) : (
                      snapshot.signals.map((signal) => (
                        <div key={signal.id} className="rounded-[2px] border border-border/60 bg-card/30 p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{signal.source}</Badge>
                            <Badge className={signal.severity === 'high' ? 'bg-destructive/15 text-destructive' : signal.severity === 'medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-muted text-muted-foreground'}>
                              {signal.severity}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{signal.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <SectionHeader
          title="Expansão"
          subtitle="Oportunidades simples nascidas de boa saúde e performance."
          icon={TrendingUp}
        />

        <Reveal delayMs={120}>
          <form onSubmit={handleCreateExpansion} className="grid gap-4 edge-card p-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cliente</label>
              <select
                value={form.clientId}
                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                className="h-9 rounded-[2px] border border-input bg-transparent px-3 text-sm"
                required
              >
                <option value="">Selecione</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">MRR estimado</label>
              <Input type="number" min="0" step="0.01" value={form.estimatedMrr} onChange={(event) => setForm((current) => ({ ...current, estimatedMrr: event.target.value }))} placeholder="1500" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Título</label>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Upsell de operação criativa" required />
            </div>
            <div className="space-y-2 lg:row-span-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Notas</label>
              <Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24" placeholder="Contexto comercial da expansão" />
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting || !form.clientId || !form.title.trim()}>
                <Plus className="h-4 w-4" />
                Registrar expansão
              </Button>
            </div>
          </form>
        </Reveal>

        <Reveal delayMs={160}>
          <div className="grid gap-4 xl:grid-cols-2">
            {expansions.map((item) => (
              <div key={item.id} className="edge-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.client.name}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.notes || 'Sem notas registradas.'}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
