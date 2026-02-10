'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { AlertTriangle, BarChart3, Loader2, TrendingUp, Users, Zap, Activity } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client/http';
import { cn } from '@/lib/utils';

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
  A: 'text-emerald-500 border-emerald-500/50 shadow-[0_0_10px_var(--color-emerald-500)]',
  B: 'text-blue-500 border-blue-500/50 shadow-[0_0_10px_var(--color-blue-500)]',
  C: 'text-amber-500 border-amber-500/50 shadow-[0_0_10px_var(--color-amber-500)]',
  D: 'text-orange-500 border-orange-500/50 shadow-[0_0_10px_var(--color-orange-500)]',
  F: 'text-red-500 border-red-500/50 shadow-[0_0_10px_var(--color-red-500)]',
};

const TIER_COLORS: Record<string, string> = {
  premium: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  basic: 'text-muted-foreground border-border bg-muted/10',
};

function KpiModule({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'text-primary',
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="relative group border border-border/50 bg-card/30 hover:bg-card/50 transition-all p-4 rounded-sm overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="h-16 w-16" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
        <p className={cn("text-2xl font-black tracking-tight drop-shadow-md", color)}>{value}</p>
        {subtitle && <p className="text-[10px] font-mono text-muted-foreground mt-1 border-t border-border/30 pt-1 inline-block">{subtitle}</p>}
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
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono">
        SYSTEM_ERROR: DASHBOARD_DATA_UNAVAILABLE
      </div>
    );
  }

  const filteredClients = filterTier === 'all'
    ? data.clients
    : data.clients.filter(c => c.tier === filterTier);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-mono text-foreground">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-primary/20 pb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
            <BarChart3 className="h-32 w-32 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary/50 text-xs tracking-[0.3em] mb-1">
              <Activity className="h-3 w-3" />
              <span>TERMINAL_ID: EXECUTIVE_OVERVIEW</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              EXECUTIVE_DASHBOARD
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Global Client Consolidation
            </p>
          </div>

          {/* Filter */}
          <div className="relative z-10 flex items-center gap-2 bg-card/50 p-1 rounded-sm border border-border/50">
            <span className="text-[10px] uppercase text-muted-foreground px-2">FILTER_TIER:</span>
            {['all', 'premium', 'basic'].map(tier => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={cn(
                  "px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all",
                  filterTier === tier
                    ? 'bg-primary/20 text-primary shadow-[0_0_10px_var(--color-primary)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiModule
            title="Total Spend (7d)"
            value={`R$ ${data.kpi.totalSpend7d.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
            color="text-emerald-400"
          />
          <KpiModule
            title="Total Conversations (7d)"
            value={String(data.kpi.totalConversations7d)}
            icon={Users}
            subtitle={data.kpi.avgCpl != null ? `Avg CPL: R$ ${data.kpi.avgCpl.toFixed(2)}` : undefined}
            color="text-blue-400"
          />
          <KpiModule
            title="Attention Required"
            value={`${data.kpi.clientsNeedingAttention}/${data.kpi.totalClients}`}
            icon={AlertTriangle}
            subtitle="Health Score < 50"
            color="text-orange-400"
          />
          <KpiModule
            title="Active Anomalies"
            value={String(data.kpi.totalAnomalies)}
            icon={Zap}
            color="text-rose-500 neon-text"
          />
        </div>

        {/* Client Grid/List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest px-4">
            <span>Client Entity</span>
            <span className="hidden md:inline">Perf_Metrics</span>
          </div>

          {filteredClients.map((client) => (
            <div key={client.clientId} className="group relative border border-border/50 bg-card/20 hover:bg-card/40 transition-all p-4 rounded-sm hover:border-primary/30 flex flex-col md:flex-row items-center gap-4">
              {/* Status Indicator */}
              <div className={cn("w-1 h-full absolute left-0 top-0 bottom-0 transition-all", client.anomalyCount > 0 ? "bg-rose-500" : "bg-primary/20 group-hover:bg-primary")} />

              <div className="flex items-center gap-4 flex-1 w-full">
                <div className="flex items-center justify-center w-10 h-10">
                  {client.healthGrade ? (
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full border text-xs font-black", GRADE_COLORS[client.healthGrade] || "border-border text-muted-foreground")}>
                      {client.healthGrade}
                    </div>
                  ) : <span className="text-muted-foreground">-</span>}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/clients/${client.clientId}/performance`} className="font-bold text-lg hover:text-primary transition-colors">
                      {client.clientName}
                    </Link>
                    <Badge variant="outline" className={cn("text-[8px] uppercase tracking-wider rounded-none px-1 py-0 border-0", TIER_COLORS[client.tier])}>
                      {client.tier}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Anomalies: <span className={cn(client.anomalyCount > 0 ? "text-rose-500 font-bold" : "")}>{client.anomalyCount}</span></span>
                    <span>Proposals: <span className={cn(client.pendingProposals > 0 ? "text-amber-500 font-bold" : "")}>{client.pendingProposals}</span></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 w-full md:w-auto text-right md:pr-8">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">Spend 7d</p>
                  <p className="font-mono text-sm">R$ {client.spend7d.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">CPL</p>
                  <p className="font-mono text-sm">{client.cpl7d != null ? `R$ ${client.cpl7d.toFixed(2)}` : '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">Conv.</p>
                  <p className="font-mono text-sm">{client.conversations7d}</p>
                </div>
              </div>
            </div>

          ))}
        </div>
      </div >
    </div >
  );
}
