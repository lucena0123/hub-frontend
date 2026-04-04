'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertTriangle, FilePlus2, FileSpreadsheet, RefreshCw, Wallet } from 'lucide-react';

import {
  activateContract,
  backfillContracts,
  createContract,
  getClients,
  listContracts,
  type Contract,
} from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client } from '@/types';
import { formatDate } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const statusLabel: Record<Contract['status'], string> = {
  draft: 'Rascunho',
  pending_signature: 'Assinatura',
  active: 'Ativo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

const statusClass: Record<Contract['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_signature: 'bg-amber-500/15 text-amber-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  expired: 'bg-orange-500/15 text-orange-300',
  cancelled: 'bg-destructive/15 text-destructive',
};

const initialForm = {
  clientId: '',
  title: '',
  serviceType: 'marketing_retainer',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  amount: '',
};

const toCurrency = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0);
};

export default function FinanceContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [nextContracts, nextClients] = await Promise.all([
        listContracts({
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(clientFilter !== 'all' ? { clientId: clientFilter } : {}),
        }),
        getClients(),
      ]);
      setContracts(nextContracts);
      setClients(nextClients);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar contratos'));
    } finally {
      setLoading(false);
    }
  }, [clientFilter, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter((contract) => contract.status === 'active').length,
    overdue: contracts.filter((contract) => (contract.overdueReceivables ?? 0) > 0).length,
  }), [contracts]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createContract({
        clientId: form.clientId,
        title: form.title || undefined,
        serviceType: form.serviceType || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || null,
        amount: form.amount ? Number(form.amount) : undefined,
      });
      setForm(initialForm);
      setFeedback('Contrato criado com sucesso.');
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao criar contrato'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackfill = async () => {
    try {
      setSubmitting(true);
      const result = await backfillContracts();
      setFeedback(`${result.created} contrato(s) gerado(s) no backfill inicial.`);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao executar backfill'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (contractId: string) => {
    try {
      setSubmitting(true);
      await activateContract(contractId);
      setFeedback('Contrato ativado e fluxo inicial gerado.');
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao ativar contrato'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Financeiro' }, { label: 'Contratos' }]}
      title="Contratos e Receita"
      description="Formalize a relação cliente -> contrato -> recebíveis e inicie o fluxo operacional das novas ondas."
      meta={(
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {summary.total}</div>
          <div className="signal-chip">Ativos {summary.active}</div>
          <div className="signal-chip">Com atraso {summary.overdue}</div>
        </div>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading || submitting}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/finance/receivables">Recebíveis</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/finance/renewals">Renovações</Link>
          </Button>
        </div>
      )}
    >
      <div className="space-y-8">
        {(error || feedback) && (
          <Reveal>
            <div className={`edge-card p-4 text-sm ${error ? 'border border-destructive/40 bg-destructive/10' : 'border border-emerald-500/40 bg-emerald-500/10'}`}>
              {error ?? feedback}
            </div>
          </Reveal>
        )}

        <SectionHeader
          title="Onda 1"
          subtitle="Backfill inicial e criação manual do contrato comercial."
          icon={Wallet}
          action={(
            <Button variant="outline" size="sm" onClick={() => void handleBackfill()} disabled={submitting}>
              <FileSpreadsheet className="h-4 w-4" />
              Backfill
            </Button>
          )}
        />

        <Reveal>
          <form onSubmit={handleCreate} className="grid gap-4 edge-card p-5 lg:grid-cols-3">
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
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Título</label>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Contrato mensal" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Serviço</label>
              <select
                value={form.serviceType}
                onChange={(event) => setForm((current) => ({ ...current, serviceType: event.target.value }))}
                className="h-9 rounded-[2px] border border-input bg-transparent px-3 text-sm"
              >
                <option value="marketing_retainer">Retainer</option>
                <option value="landing_page">Landing Page</option>
                <option value="paid_media">Paid Media</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Início</label>
              <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fim</label>
              <Input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Valor</label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="3500" />
            </div>
            <div className="lg:col-span-3 flex justify-end">
              <Button type="submit" disabled={submitting || !form.clientId}>
                <FilePlus2 className="h-4 w-4" />
                Criar contrato
              </Button>
            </div>
          </form>
        </Reveal>

        <SectionHeader
          title="Carteira contratual"
          subtitle="Contratos que já podem alimentar recebíveis, projetos e onboarding."
          icon={Wallet}
          badge={(
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-8 rounded-[2px] border border-input bg-transparent px-2 text-xs"
              >
                <option value="all">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="pending_signature">Assinatura</option>
                <option value="active">Ativo</option>
                <option value="expired">Expirado</option>
                <option value="cancelled">Cancelado</option>
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
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando contratos...</div>
          ) : contracts.length === 0 ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Nenhum contrato encontrado para o filtro atual.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {contracts.map((contract) => (
                <div key={contract.id} className="edge-card hover-lift relative p-5">
                  <div className="absolute left-0 top-0 h-full w-[2px] rounded-l-sm bg-primary/40" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[contract.status]}>{statusLabel[contract.status]}</Badge>
                        {(contract.overdueReceivables ?? 0) > 0 && (
                          <Badge className="bg-destructive/15 text-destructive">{contract.overdueReceivables} atraso(s)</Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">{contract.client.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${contract.clientId}`}>Cliente</Link>
                      </Button>
                      {contract.status !== 'active' && (
                        <Button size="sm" onClick={() => void handleActivate(contract.id)} disabled={submitting}>
                          Ativar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Serviço</p>
                      <p className="text-sm">{contract.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Período</p>
                      <p className="text-sm">{formatDate(contract.startDate, 'dd/MM/yyyy')} - {formatDate(contract.endDate, 'dd/MM/yyyy', 'Sem fim')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Valor</p>
                      <p className="text-sm">{toCurrency(contract.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recebíveis</p>
                      <p className="text-sm">{contract.openReceivables ?? 0} abertos</p>
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
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
              <p>Ativar contrato dispara a base da próxima onda: recebíveis, projeto inicial e onboarding de CS.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
