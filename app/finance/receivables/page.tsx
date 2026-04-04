'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, CalendarClock, CreditCard, RefreshCw } from 'lucide-react';

import { getClients, listReceivables, recordPayment, type Receivable } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Client } from '@/types';
import { formatDate } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const statusLabel: Record<Receivable['status'], string> = {
  scheduled: 'Agendado',
  issued: 'Emitido',
  paid: 'Pago',
  overdue: 'Atrasado',
  suspended: 'Suspenso',
};

const statusClass: Record<Receivable['status'], string> = {
  scheduled: 'bg-blue-500/15 text-blue-300',
  issued: 'bg-primary/15 text-primary',
  paid: 'bg-emerald-500/15 text-emerald-300',
  overdue: 'bg-destructive/15 text-destructive',
  suspended: 'bg-orange-500/15 text-orange-300',
};

const toCurrency = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0);
};

export default function FinanceReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [nextReceivables, nextClients] = await Promise.all([
        listReceivables({
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(clientFilter !== 'all' ? { clientId: clientFilter } : {}),
        }),
        getClients(),
      ]);
      setReceivables(nextReceivables);
      setClients(nextClients);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar recebíveis'));
    } finally {
      setLoading(false);
    }
  }, [clientFilter, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const total = receivables.reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
    const overdue = receivables
      .filter((item) => item.status === 'overdue')
      .reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
    const paid = receivables.filter((item) => item.status === 'paid').length;
    return { total, overdue, paid };
  }, [receivables]);

  const handleMarkPaid = async (receivable: Receivable) => {
    try {
      setBusyId(receivable.id);
      await recordPayment(receivable.id, {
        amount: Number(receivable.amount ?? 0),
        paymentMethod: 'manual',
      });
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao registrar pagamento'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Financeiro' }, { label: 'Recebíveis' }]}
      title="Agenda de Recebíveis"
      description="MVP financeiro interno para emissão operacional, baixa manual e leitura rápida de inadimplência."
      meta={(
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Previsto {toCurrency(summary.total)}</div>
          <div className="signal-chip">Atrasado {toCurrency(summary.overdue)}</div>
          <div className="signal-chip">Pagos {summary.paid}</div>
        </div>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/finance/contracts">Contratos</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/finance/renewals">Renovações</Link>
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
          title="Filtro financeiro"
          subtitle="Separe por cliente ou situação da cobrança."
          icon={CalendarClock}
          badge={(
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-8 rounded-[2px] border border-input bg-transparent px-2 text-xs"
              >
                <option value="all">Todos os status</option>
                <option value="scheduled">Agendado</option>
                <option value="issued">Emitido</option>
                <option value="paid">Pago</option>
                <option value="overdue">Atrasado</option>
                <option value="suspended">Suspenso</option>
              </select>
              <select
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
                className="h-8 rounded-[2px] border border-input bg-transparent px-2 text-xs"
              >
                <option value="all">Todos os clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        <Reveal delayMs={80}>
          {loading ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando recebíveis...</div>
          ) : receivables.length === 0 ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Nenhum recebível encontrado.</div>
          ) : (
            <div className="space-y-4">
              {receivables.map((receivable) => (
                <div key={receivable.id} className="edge-card hover-lift p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[receivable.status]}>{statusLabel[receivable.status]}</Badge>
                        <Badge variant="outline">{receivable.referenceLabel}</Badge>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{receivable.client.name}</p>
                        <p className="text-sm text-muted-foreground">{receivable.contract.title}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${receivable.clientId}`}>Cliente</Link>
                      </Button>
                      {receivable.status !== 'paid' && (
                        <Button size="sm" onClick={() => void handleMarkPaid(receivable)} disabled={busyId === receivable.id}>
                          <CreditCard className="h-4 w-4" />
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vencimento</p>
                      <p className="text-sm">{formatDate(receivable.dueDate, 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Valor</p>
                      <p className="text-sm">{toCurrency(receivable.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Baixa</p>
                      <p className="text-sm">{formatDate(receivable.paidAt, 'dd/MM/yyyy', 'Pendente')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Pagamentos</p>
                      <p className="text-sm">{receivable.payments?.length ?? 0} registro(s)</p>
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
              <ArrowRightLeft className="mt-0.5 h-4 w-4 text-primary" />
              <p>Nesta primeira entrega a baixa é manual. Integrações externas de emissão e cobrança ficam fora do MVP.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
