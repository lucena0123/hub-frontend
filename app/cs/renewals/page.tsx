'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarSync, RefreshCw, ShieldAlert } from 'lucide-react';

import { listAccountRenewals, type RenewalOpportunity } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const statusClass: Record<RenewalOpportunity['status'], string> = {
  open: 'bg-primary/15 text-primary',
  overdue: 'bg-destructive/15 text-destructive',
  won: 'bg-emerald-500/15 text-emerald-300',
  lost: 'bg-muted text-muted-foreground',
};

export default function CustomerSuccessRenewalsPage() {
  const [renewals, setRenewals] = useState<RenewalOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRenewals = async () => {
    try {
      setLoading(true);
      const data = await listAccountRenewals();
      setRenewals(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar board de renovação'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRenewals();
  }, []);

  const summary = useMemo(() => ({
    total: renewals.length,
    open: renewals.filter((item) => item.status === 'open').length,
    overdue: renewals.filter((item) => item.status === 'overdue').length,
  }), [renewals]);

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Customer Success' }, { label: 'Renovações' }]}
      title="Renovação e Retenção"
      description="CS prepara renovação em D-60 e usa o board do Financeiro como verdade contratual."
      meta={(
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {summary.total}</div>
          <div className="signal-chip">Abertas {summary.open}</div>
          <div className="signal-chip">Em atraso {summary.overdue}</div>
        </div>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/finance/renewals">Financeiro</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadRenewals()} disabled={loading}>
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
          title="Contas em janela de retenção"
          subtitle="CS acompanha renovação por cliente e prepara plano de continuidade."
          icon={CalendarSync}
        />

        <Reveal delayMs={80}>
          {loading ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando renovações...</div>
          ) : renewals.length === 0 ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Nenhuma renovação em acompanhamento.</div>
          ) : (
            <div className="space-y-4">
              {renewals.map((renewal) => (
                <div key={renewal.id} className="edge-card hover-lift p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[renewal.status]}>{renewal.status}</Badge>
                        {renewal.healthStatus && <Badge variant="outline">{renewal.healthStatus}</Badge>}
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{renewal.client.name}</p>
                        <p className="text-sm text-muted-foreground">{renewal.contract.title}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${renewal.clientId}`}>Cliente</Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Data alvo</p>
                      <p className="text-sm">{formatDate(renewal.dueDate, 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Fim contratual</p>
                      <p className="text-sm">{formatDate(renewal.contract.endDate, 'dd/MM/yyyy', 'Aberto')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contexto</p>
                      <p className="text-sm text-muted-foreground">{renewal.notes || 'Sem observações de retenção ainda.'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delayMs={120}>
          <div className="edge-card p-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-400" />
              <p>Renovação no MVP é compartilhada: CS acompanha a oportunidade e Financeiro formaliza novo termo contratual.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
