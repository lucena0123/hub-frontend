'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardOverview, getAlerts, getDashboardSparklines } from '@/lib/api/client';
import type { AlertsResponse, DashboardOverview, SparklineData } from '@/types';
import { Activity, Cpu, Zap, AlertTriangle, Server, TrendingUp, DollarSign, MousePointer, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { MiniMetric } from '@/components/dashboard/mini-metric';
import { CompareBanner } from '@/components/dashboard/compare-banner';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { Skeleton, SkeletonMetric, SkeletonRow } from '@/components/ui/skeleton';

// --- Type Guards & Utils ---
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDashboardOverview = (value: unknown): value is DashboardOverview => {
  if (!isRecord(value)) return false;

  return (
    'clients' in value &&
    'campaigns' in value &&
    'performance' in value &&
    'bpmn' in value &&
    'recentActivity' in value
  );
};

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return 'ERR';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function timeAgo(timestamp: string): string {
  const diffMin = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}m`; 
  return `${Math.floor(diffMin / 60)}h`;
}

const PlatformBar = ({ name, value, total, color }: { name: string; value: number; total: number; color: string }) => {
  const width = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="group space-y-1">
      <div className="flex justify-between text-xs uppercase tracking-wider">
        <span className="text-muted-foreground group-hover:text-primary transition-colors">{name}</span>
        <span className="text-xs">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary/60 overflow-hidden">
        <div
          className="h-full transition-all duration-500 relative"
          style={{ width: `${width}%`, backgroundColor: color }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-foreground/60" />
        </div>
      </div>
    </div>
  );
};

const ProgressFill = ({ pct, className }: { pct: number; className?: string }) => (
  <div className={cn('h-full transition-all duration-500', className)} style={{ width: `${pct}%` }} />
);

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [sparklines, setSparklines] = useState<SparklineData | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, alertsData, sparklineData] = await Promise.all([
          getDashboardOverview(),
          getAlerts().catch(() => null),
          getDashboardSparklines(),
        ]);

        const data: unknown = overviewData;
        if (isDashboardOverview(data)) {
          setOverview(data);
          setAlerts(alertsData);
          setSparklines(sparklineData);
        } else {
          setError('Falha ao validar dados do painel.');
        }
      } catch {
        setError('Conexão indisponível no momento.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <PageShell
      eyebrow="Agência / Visão geral"
      title="Radar Operacional"
      description="Resumo executivo do portfolio de campanhas com sinais rápidos para priorizar ação."
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonMetric key={i} />)}
        </div>
        <Skeleton className="h-24 w-full rounded-sm" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] gap-8">
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48 rounded-sm" />
              <Skeleton className="h-48 rounded-sm" />
            </div>
          </div>
          <div className="space-y-0 mt-10">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    </PageShell>
  );

  if (error || !overview) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="border border-destructive/50 bg-destructive/10 p-8 rounded-[2px] text-center space-y-4 max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-destructive/80" />
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-destructive tracking-widest">FALHA NO SISTEMA</h2>
        <p className="text-destructive/80 text-sm">{error}</p>
        <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/20 w-full mt-4" onClick={() => window.location.reload()}>
          TENTAR NOVAMENTE
        </Button>
      </div>
    </div>
  );

  const platformData = Object.entries(overview.campaigns.byPlatform || {}).map(([k, v]) => ({ name: k, value: v as number }));
  const totalCampaigns = overview.campaigns.active;
  const recentLogs = overview.recentActivity || [];

  const performanceVector = [
    { name: 'Investimento', brl: overview.performance.totalSpend },
    { name: 'Receita',      brl: overview.performance.totalRevenue },
    { name: 'Leads',        count: overview.performance.totalLeads },
    { name: 'Conversões',   count: overview.performance.totalConversions },
  ];

  const executionRatio = overview.clients.total > 0
    ? Math.min(100, Math.round((overview.bpmn.clientsInExecution / overview.clients.total) * 100))
    : 0;

  const monitoringRatio = overview.clients.total > 0
    ? Math.min(100, Math.round((overview.bpmn.clientsInMonitoring / overview.clients.total) * 100))
    : 0;

  const topAlert = alerts?.alerts?.[0];

  const recommendedActions: Array<{ label: string; href: string; tone: 'default' | 'warning' }> = [];

  if (overview.performance.avgRoas < 2) {
    const href = topAlert?.clientId
      ? `/optimization/board?clientId=${topAlert.clientId}`
      : '/optimization/board';
    recommendedActions.push({
      label: topAlert?.clientName
        ? `ROAS abaixo do alvo: revisar prioridades (${topAlert.clientName})`
        : 'ROAS abaixo do alvo: revisar prioridades no board',
      href,
      tone: 'warning',
    });
  }

  if (overview.performance.avgCpl > 20) {
    const href = topAlert?.clientId
      ? `/optimization/settings?clientId=${topAlert.clientId}`
      : '/optimization/settings';
    recommendedActions.push({
      label: topAlert?.clientName
        ? `CPL elevado: ajustar thresholds (${topAlert.clientName})`
        : 'CPL elevado: ajustar thresholds de regras',
      href,
      tone: 'warning',
    });
  }

  if (recommendedActions.length === 0) {
    const href = topAlert?.clientId
      ? `/optimization/effectiveness?clientId=${topAlert.clientId}`
      : '/optimization/effectiveness';
    recommendedActions.push({
      label: topAlert?.clientName
        ? `Operação estável: validar efetividade (${topAlert.clientName})`
        : 'Operação estável: validar efetividade e manter baseline',
      href,
      tone: 'default',
    });
  }

  return (
    <PageShell
      eyebrow="Agência / Visão geral"
      title="Radar Operacional"
      description="Resumo executivo do portfolio de campanhas."
      meta={
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            Clientes {overview.clients.active}/{overview.clients.total}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            Campanhas {overview.campaigns.active}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            CPL R${overview.performance.avgCpl.toFixed(2)}
          </span>
        </div>
      }
    >
      {/* Row 1: 4 KPI Cards */}
      <Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Clientes ativos"
            value={overview.clients.active}
            unit={`/ ${overview.clients.total}`}
            delta={overview.performance.delta?.totalSpend}
            sparklineData={sparklines?.clients}
          />
          <KpiCard
            label="Campanhas ativas"
            value={overview.campaigns.active}
            sparklineData={sparklines?.leads}
          />
          <KpiCard
            label="ROI médio"
            value={overview.performance.avgRoas.toFixed(2)}
            unit="x"
            delta={overview.performance.delta?.avgRoas}
            sparklineData={sparklines?.roas}
            valueColor="text-emerald-600"
          />
          <KpiCard
            label="Investimento total"
            value={formatCurrency(overview.performance.totalSpend)}
            delta={overview.performance.delta?.totalSpend}
            sparklineData={sparklines?.spend}
          />
        </div>
      </Reveal>

      {/* Row 2: Gráfico (col-2) + Banner (col-2) */}
      <Reveal delayMs={60}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Financeiro mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={performanceVector} barGap={4}>
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value, name) => {
                      const numeric = typeof value === 'number' ? value : Number(value ?? 0);
                      return name === 'brl' ? [formatCurrency(numeric), 'Financeiro'] : [numeric, 'Volume'];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="brl" fill="var(--primary)" radius={[4, 4, 0, 0]} name="brl" />
                  <Bar yAxisId="right" dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="count" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <CompareBanner
              totalSpend={overview.performance.totalSpend}
              activeClients={overview.clients.active}
            />
          </div>
        </div>
      </Reveal>

      {/* Row 3: Log de eventos (col-3) + Mini métricas (col-1) */}
      <Reveal delayMs={120}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Server className="h-3 w-3" /> Log de eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <div className="space-y-0 relative">
                <div className="absolute left-6 top-0 bottom-0 w-[1px] border-l border-dashed border-muted-foreground/20" />
                {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors relative">
                    <div className={cn('mt-1.5 h-2 w-2 rounded-full flex-shrink-0 z-10', log.type === 'report' ? 'bg-primary/70' : 'bg-emerald-500/70')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 leading-snug">{log.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="px-4 text-xs text-muted-foreground">Nenhum evento recente.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3" /> Métricas rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-0 pb-4">
              <MiniMetric icon={TrendingUp} iconBg="indigo" label="ROI Médio" value={`${overview.performance.avgRoas.toFixed(2)}x`} delta={overview.performance.delta?.avgRoas} />
              <MiniMetric icon={DollarSign} iconBg="emerald" label="CPL Médio" value={`R$${overview.performance.avgCpl.toFixed(2)}`} delta={overview.performance.delta?.avgCpl} />
              <MiniMetric icon={MousePointer} iconBg="amber" label="CTR Médio" value={`${overview.performance.avgCtr.toFixed(2)}%`} delta={overview.performance.delta?.avgCtr} />
              <MiniMetric icon={Users} iconBg="rose" label="Conversões" value={String(overview.performance.totalConversions)} delta={overview.performance.delta?.totalConversions} isLast />
            </CardContent>
          </Card>
        </div>
      </Reveal>

      {/* Row 4: Pipeline BPMN + Plataformas */}
      <Reveal delayMs={180}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Pipeline de execução
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  {overview.bpmn.avgProgress}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <div className="flex justify-between"><span>Execução</span><span className="text-primary">{overview.bpmn.clientsInExecution}</span></div>
                <div className="h-1 bg-secondary w-full rounded-full overflow-hidden"><ProgressFill pct={executionRatio} className="bg-primary rounded-full" /></div>
                <div className="flex justify-between"><span>Monitoramento</span><span className="text-emerald-500">{overview.bpmn.clientsInMonitoring}</span></div>
                <div className="h-1 bg-secondary w-full rounded-full overflow-hidden"><ProgressFill pct={monitoringRatio} className="bg-emerald-500 rounded-full" /></div>
                <div className="flex justify-between"><span>Bloqueados</span><span className="text-red-500">{overview.bpmn.blockedClients}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" /> Distribuição por plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {platformData.map((p, i) => (
                <PlatformBar key={p.name} name={p.name} value={p.value} total={totalCampaigns} color={i % 2 === 0 ? 'var(--primary)' : 'var(--chart-2)'} />
              ))}
            </CardContent>
          </Card>
        </div>
      </Reveal>
    </PageShell>
  );
}
