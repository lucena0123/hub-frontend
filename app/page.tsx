'use client';

import { useEffect, useState } from 'react';
import { getDashboardOverview } from '@/lib/api/client';
import type { DashboardOverview } from '@/types';
import { Activity, Cpu, Wifi, Zap, AlertTriangle, Server } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

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

const HudMetric = ({
  label,
  value,
  unit,
  color = 'text-primary',
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}) => (
  <div className="edge-card hover-lift relative overflow-hidden px-5 py-4">
    <div className="absolute left-0 top-0 h-full w-[2px] bg-primary/60" />
    <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
    <div className="mt-2 flex items-baseline gap-2">
      <span className={cn('text-2xl font-semibold', color)}>{value}</span>
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  </div>
);

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

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data: unknown = await getDashboardOverview();
        if (isDashboardOverview(data)) {
          setOverview(data);
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center text-xs text-primary animate-pulse">SYNC</div>
        </div>
        <div className="text-primary tracking-[0.2em] text-sm animate-pulse">CARREGANDO PAINEL...</div>
      </div>
    </div>
  );

  if (error || !overview) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="border border-destructive/50 bg-destructive/10 p-8 rounded-[2px] text-center space-y-4 max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-destructive/80" />
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
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
    { name: 'Investimento', val: overview.performance.totalSpend },
    { name: 'Receita', val: overview.performance.totalRevenue },
    { name: 'Leads', val: overview.performance.totalLeads * 100 },
    { name: 'Conversões', val: overview.performance.totalConversions * 100 },
  ];

  const executionRatio = overview.clients.total > 0
    ? Math.min(100, Math.round((overview.bpmn.clientsInExecution / overview.clients.total) * 100))
    : 0;

  const monitoringRatio = overview.clients.total > 0
    ? Math.min(100, Math.round((overview.bpmn.clientsInMonitoring / overview.clients.total) * 100))
    : 0;

  return (
    <PageShell
      eyebrow="Agência / Visão geral"
      title="Radar Operacional"
      description="Resumo executivo do portfolio de campanhas com sinais rápidos para priorizar ação."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Clientes ativos {overview.clients.active}/{overview.clients.total}</div>
          <div className="signal-chip">Campanhas ativas {overview.campaigns.active}</div>
          <div className="signal-chip">CPL médio {overview.performance.avgCpl.toFixed(2)}</div>
        </div>
      }
    >
      <div className="space-y-8">
        <SectionHeader
          title="Sinais Principais"
          subtitle="Leituras rápidas de volume, ROI e investimento."
          icon={Activity}
        />

        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <HudMetric
              label="Clientes ativos"
              value={overview.clients.active}
              unit={`/ ${overview.clients.total}`}
            />
            <HudMetric
              label="Campanhas ativas"
              value={overview.campaigns.active}
            />
            <HudMetric
              label="ROI médio"
              value={overview.performance.avgRoas.toFixed(2)}
              unit="x"
              color="text-emerald-400"
            />
            <HudMetric
              label="Investimento total"
              value={formatCurrency(overview.performance.totalSpend)}
            />
          </div>
        </Reveal>

        <SectionHeader
          title="Telemetria & Logs"
          subtitle="Performance em tempo real, pipeline e histórico de eventos."
          icon={Server}
        />

        <Reveal delayMs={120}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] gap-8">
            <div className="space-y-6">
              <Card className="relative overflow-hidden h-[400px]">
                <div className="absolute top-0 right-0 p-2 opacity-60"><Wifi className="h-4 w-4 text-primary" /></div>
                <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground tracking-[0.3em] uppercase">Analytics Stream</div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg tracking-[0.2em] uppercase">
                    <Activity className="h-4 w-4 text-primary" />
                    Vetor de performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceVector}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--signal)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--signal)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--primary)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="var(--signal)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Cpu className="h-4 w-4" /> Pipeline de execução
                      </CardTitle>
                      <Badge variant="outline" className="signal-chip">
                        {overview.bpmn.avgProgress}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 pt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Execução</span>
                        <span className="text-primary">{overview.bpmn.clientsInExecution}</span>
                      </div>
                      <div className="h-1 bg-secondary w-full">
                        <div className="h-full bg-primary" style={{ width: `${executionRatio}%` }} />
                      </div>

                      <div className="flex justify-between">
                        <span>Monitoramento</span>
                        <span className="text-emerald-500">{overview.bpmn.clientsInMonitoring}</span>
                      </div>
                      <div className="h-1 bg-secondary w-full">
                        <div className="h-full bg-emerald-500" style={{ width: `${monitoringRatio}%` }} />
                      </div>
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
                      <PlatformBar
                        key={p.name}
                        name={p.name}
                        value={p.value}
                        total={totalCampaigns}
                        color={i % 2 === 0 ? 'var(--signal)' : 'var(--chart-2)'}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6 lg:mt-10">
              <Card className="h-full">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Server className="h-3 w-3" /> Log de eventos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-0">
                  <div className="space-y-0 relative">
                    <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-border/30 border-l border-dashed border-muted-foreground/20" />

                    {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                      <div key={i} className="group flex items-start pl-4 pr-4 py-3 hover:bg-primary/5 transition-colors relative">
                        <div className={cn(
                          "h-1.5 w-1.5 mt-1.5 mr-4 rounded-full z-10",
                          log.type === 'report' ? "bg-primary" : "bg-emerald-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground/80 truncate">{log.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(log.timestamp)}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">Sem eventos recentes</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
