'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, TrendingUp, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client/http';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';

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

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-400 border-emerald-500/50',
  B: 'text-primary border-primary/50',
  C: 'text-amber-400 border-amber-500/50',
  D: 'text-orange-400 border-orange-500/50',
  F: 'text-destructive border-destructive/50',
};

const TIER_COLORS: Record<string, string> = {
  premium: 'text-primary border-primary/40 bg-primary/10',
  basic: 'text-muted-foreground border-border bg-muted/10',
};

function KpiModule({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'text-primary',
  className,
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  subtitle?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("edge-card hover-lift relative overflow-hidden p-4 group", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="h-16 w-16" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{title}</p>
        <p className={cn("text-2xl font-semibold tracking-tight", color)}>{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/30 pt-2 inline-block">{subtitle}</p>}
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
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Falha ao carregar o painel executivo.
      </div>
    );
  }

  const filteredClients = filterTier === 'all'
    ? data.clients
    : data.clients.filter(c => c.tier === filterTier);

  return (
    <PageShell
      eyebrow="Agência / Executivo"
      title="Panorama Executivo"
      description="Consolidação global de performance e saúde das contas para decisão rápida."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Clientes {data.kpi.totalClients}</div>
          <div className="signal-chip">Atenção {data.kpi.clientsNeedingAttention}</div>
          <div className="signal-chip">Anomalias {data.kpi.totalAnomalies}</div>
        </div>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {['all', 'premium', 'basic'].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={cn(
                "px-3 py-2 rounded-[2px] text-[10px] font-semibold uppercase tracking-[0.3em] transition-all border hover-lift",
                filterTier === tier
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {tier}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-8">
        <SectionHeader
          title="KPIs Executivos"
          subtitle="Sinais principais de investimento e risco."
          icon={TrendingUp}
        />

        <Reveal>
          <div className="flex flex-wrap gap-4">
            <KpiModule
              title="Total Spend (7d)"
              value={`R$ ${data.kpi.totalSpend7d.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={TrendingUp}
              color="text-emerald-400"
              className="flex-[1.4_1_260px]"
            />
            <KpiModule
              title="Conversas (7d)"
              value={String(data.kpi.totalConversations7d)}
              icon={Users}
              subtitle={data.kpi.avgCpl != null ? `CPL médio: R$ ${data.kpi.avgCpl.toFixed(2)}` : undefined}
              color="text-primary"
              className="flex-[1_1_220px]"
            />
            <KpiModule
              title="Atenção"
              value={`${data.kpi.clientsNeedingAttention}/${data.kpi.totalClients}`}
              icon={AlertTriangle}
              subtitle="Health < 50"
              color="text-amber-400"
              className="flex-[1_1_200px]"
            />
            <KpiModule
              title="Anomalias"
              value={String(data.kpi.totalAnomalies)}
              icon={Zap}
              color="text-destructive"
              className="flex-[0.9_1_180px]"
            />
          </div>
        </Reveal>

        <SectionHeader
          title="Carteira Monitorada"
          subtitle="Clientes com indicadores críticos ou oportunidades."
          icon={Users}
        />

        <Reveal delayMs={120}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-[0.3em] px-2">
              <span>Cliente</span>
              <span className="hidden md:inline">Operação 7d</span>
            </div>

            {filteredClients.map((client, index) => {
              const offset =
                index % 3 === 0 ? "lg:translate-x-6" : index % 3 === 1 ? "lg:-translate-x-4" : "";

              return (
                <div
                  key={client.clientId}
                  className={cn(
                    "group relative edge-card hover-lift p-4 flex flex-col lg:flex-row items-start lg:items-center gap-4",
                    offset
                  )}
                >
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-[2px] transition-all",
                    client.anomalyCount > 0 ? "bg-destructive" : "bg-primary/40"
                  )} />

                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="flex items-center justify-center w-10 h-10">
                      {client.healthGrade ? (
                        <div className={cn("flex items-center justify-center w-9 h-9 rounded-full border text-xs font-semibold", GRADE_COLORS[client.healthGrade] || "border-border text-muted-foreground")}>
                          {client.healthGrade}
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/clients/${client.clientId}/performance`} className="font-semibold text-lg hover:text-primary transition-colors">
                          {client.clientName}
                        </Link>
                        <Badge variant="outline" className={cn("text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 border", TIER_COLORS[client.tier])}>
                          {client.tier}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        <span>Anomalias: <span className={cn(client.anomalyCount > 0 ? "text-destructive font-semibold" : "")}>{client.anomalyCount}</span></span>
                        <span>Propostas: <span className={cn(client.pendingProposals > 0 ? "text-amber-400 font-semibold" : "")}>{client.pendingProposals}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 w-full lg:w-auto text-right">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Spend 7d</p>
                      <p className="text-sm">R$ {client.spend7d.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">CPL</p>
                      <p className="text-sm">{client.cpl7d != null ? `R$ ${client.cpl7d.toFixed(2)}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Conv.</p>
                      <p className="text-sm">{client.conversations7d}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
