'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, AlertTriangle, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api/client/http';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { OperationalHealthCard } from '@/components/dashboard/operational-health-card';

type ClientSummary = {
  clientId: string;
  clientName: string;
  tier: string;
  status: string;
  healthScore: number | null;
  healthGrade: string | null;
  spend7d: number;
  spend30d: number;
  conversations7d: number;
  cpl7d: number | null;
  anomalyCount: number;
  pendingProposals: number;
};

type ExecutiveData = {
  kpi: {
    totalSpend7d: number;
    totalConversations7d: number;
    avgCpl: number | null;
    clientsNeedingAttention: number;
    totalAnomalies: number;
    totalClients: number;
  };
  clients: ClientSummary[];
};

function SeverityGroup({
  label,
  clients,
  labelClass,
}: {
  label: string;
  clients: ClientSummary[];
  labelClass: string;
}) {
  if (clients.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn('text-[11px] font-bold uppercase tracking-[0.12em]', labelClass)}>
          {label}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">({clients.length})</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2">
        {clients.map((c) => (
          <OperationalHealthCard key={c.clientId} client={c} />
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    apiClient
      .get<ExecutiveData>('/api/dashboard/executive')
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredClients = useMemo(() => {
    if (!data) return [];
    return filterTier === 'all'
      ? data.clients
      : data.clients.filter((c) => c.tier === filterTier);
  }, [data, filterTier]);

  const criticalClients = useMemo(
    () => filteredClients.filter((c) => c.anomalyCount > 0 || c.healthGrade === 'F' || c.healthGrade === 'D'),
    [filteredClients]
  );
  const warningClients = useMemo(
    () => filteredClients.filter((c) => c.healthGrade === 'C' && c.anomalyCount === 0),
    [filteredClients]
  );
  const healthyClients = useMemo(
    () => filteredClients.filter((c) => (c.healthGrade === 'A' || c.healthGrade === 'B') && c.anomalyCount === 0),
    [filteredClients]
  );

  const tiers = ['all', 'premium', 'enterprise', 'basic'];
  const tierLabel: Record<string, string> = { all: 'Todos', premium: 'Premium', enterprise: 'Enterprise', basic: 'Basic' };

  if (loading) {
    return (
      <PageShell eyebrow="Agencia / Executivo" title="Panorama Executivo">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="space-y-2 mt-6">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell eyebrow="Agencia / Executivo" title="Panorama Executivo">
        <EmptyState
          icon={AlertTriangle}
          title="Falha ao carregar"
          description="Nao foi possivel carregar o painel executivo."
          action={{ label: 'Tentar novamente', onClick: () => window.location.reload() }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Agencia / Executivo"
      title="Panorama Executivo"
      actions={
        <div className="flex gap-1.5">
          {tiers.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFilterTier(tier)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer',
                filterTier === tier
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {tierLabel[tier]}
            </button>
          ))}
        </div>
      }
      meta={
        <div className="flex flex-wrap gap-2">
          {data.kpi.clientsNeedingAttention > 0 && (
            <StatusPill status="warning" label={`${data.kpi.clientsNeedingAttention} em atencao`} />
          )}
          {data.kpi.totalAnomalies > 0 && (
            <StatusPill status="critical" label={`${data.kpi.totalAnomalies} anomalias`} />
          )}
          <StatusPill status="pending" label={`${data.kpi.totalClients} clientes`} />
        </div>
      }
    >
      {/* KPI Strip */}
      <Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Investimento 7d"
            value={`R$${data.kpi.totalSpend7d.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
            valueColor="text-emerald-600"
          />
          <KpiCard
            label="Conversas 7d"
            value={data.kpi.totalConversations7d}
            unit={data.kpi.avgCpl != null ? `CPL R$${data.kpi.avgCpl.toFixed(0)}` : undefined}
          />
          <KpiCard
            label="Em Atencao"
            value={`${data.kpi.clientsNeedingAttention}/${data.kpi.totalClients}`}
            valueColor={data.kpi.clientsNeedingAttention > 0 ? 'text-amber-600' : 'text-emerald-600'}
          />
          <KpiCard
            label="Anomalias"
            value={data.kpi.totalAnomalies}
            valueColor={data.kpi.totalAnomalies > 0 ? 'text-destructive' : 'text-emerald-600'}
          />
        </div>
      </Reveal>

      {/* Quick links */}
      <Reveal delayMs={40}>
        <div className="flex flex-wrap gap-2">
          <Link href="/alerts" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <AlertTriangle className="h-3 w-3" /> Ver alertas
          </Link>
          <Link href="/tasks" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <Zap className="h-3 w-3" /> Ver tarefas
          </Link>
          <Link href="/optimization/effectiveness" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <TrendingUp className="h-3 w-3" /> Efetividade
          </Link>
        </div>
      </Reveal>

      {/* Client queue */}
      <Reveal delayMs={80}>
        {filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente"
            description="Nenhum cliente encontrado para este filtro."
          />
        ) : (
          <div className="space-y-6">
            <SeverityGroup
              label="Critico"
              clients={criticalClients}
              labelClass="text-destructive"
            />
            <SeverityGroup
              label="Atencao"
              clients={warningClients}
              labelClass="text-amber-500 dark:text-amber-400"
            />
            <SeverityGroup
              label="Saudavel"
              clients={healthyClients}
              labelClass="text-emerald-600 dark:text-emerald-400"
            />
          </div>
        )}
      </Reveal>
    </PageShell>
  );
}
