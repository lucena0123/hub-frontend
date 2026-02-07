'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { getDashboardOverview } from '@/lib/api/client';
import type { DashboardOverview } from '@/types';
import {
  Users,
  BarChart3,
  DollarSign,
  PlayCircle,
  FileText,
  Activity,
  Target,
  TrendingUp,
  UserCheck,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDashboardOverview = (value: unknown): value is DashboardOverview => {
  if (!isRecord(value)) return false;

  const clients = value.clients;
  const campaigns = value.campaigns;
  const performance = value.performance;
  const bpmn = value.bpmn;
  const reports = value.reports;

  if (!isRecord(clients) || typeof clients.total !== 'number' || typeof clients.active !== 'number') {
    return false;
  }

  if (
    !isRecord(campaigns) ||
    typeof campaigns.total !== 'number' ||
    typeof campaigns.active !== 'number'
  ) {
    return false;
  }

  if (
    !isRecord(performance) ||
    typeof performance.totalSpend !== 'number' ||
    typeof performance.totalRevenue !== 'number' ||
    typeof performance.avgRoas !== 'number' ||
    typeof performance.avgCtr !== 'number'
  ) {
    return false;
  }

  if (!isRecord(bpmn) || typeof bpmn.avgProgress !== 'number') {
    return false;
  }

  if (
    !isRecord(reports) ||
    typeof reports.totalGenerated !== 'number' ||
    !(typeof reports.lastGenerated === 'string' || reports.lastGenerated === null)
  ) {
    return false;
  }

  return Array.isArray(value.recentActivity);
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '-';
  return `${value.toFixed(2)}%`;
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return 'ontem';
  if (diffD < 7) return `há ${diffD} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const platformColors: Record<string, string> = {
  meta: '#3b82f6',
  google: '#f59e0b',
  linkedin: '#0a66c2',
  tiktok: '#000000',
  other: '#6b7280',
};

const platformLabels: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  other: 'Outros',
};

const tierColors: Record<string, string> = {
  enterprise: '#8b5cf6',
  premium: '#3b82f6',
  standard: '#10b981',
  basic: '#6b7280',
};

const tierLabels: Record<string, string> = {
  enterprise: 'Enterprise',
  premium: 'Premium',
  standard: 'Standard',
  basic: 'Básico',
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data: unknown = await getDashboardOverview();
        if (!isDashboardOverview(data)) {
          throw new Error(
            'Resposta inesperada do dashboard. Verifique se o backend está rodando.'
          );
        }
        setOverview(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Verifique se o backend Fastify está rodando e se NEXT_PUBLIC_API_URL está configurado corretamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!overview) return null;

  const platformData = Object.entries(overview.campaigns.byPlatform || {}).map(
    ([key, count]) => ({
      name: platformLabels[key] || key,
      value: count as number,
      color: platformColors[key] || '#6b7280',
    })
  );

  const tierData = Object.entries(overview.clients.byTier || {}).map(
    ([key, count]) => ({
      name: tierLabels[key] || key,
      value: count as number,
      color: tierColors[key] || '#6b7280',
    })
  );

  const totalTierClients = tierData.reduce((sum, t) => sum + t.value, 0) || 1;

  const bpmnTotal =
    (overview.bpmn.clientsInExecution || 0) +
    (overview.bpmn.clientsInMonitoring || 0) +
    (overview.bpmn.blockedClients || 0);

  const activityItems = overview.recentActivity ?? [];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-muted-foreground text-sm">
              Visão geral do seu negócio
            </p>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Atualizado {timeAgo(lastUpdated.toISOString())}
            </p>
          )}
        </div>

        {/* KPI Cards - Linha Principal */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Clientes Ativos"
            value={overview.clients.active}
            icon={Users}
            color="blue"
            description={`de ${overview.clients.total} total`}
          />
          <StatsCard
            title="Campanhas Ativas"
            value={overview.campaigns.active}
            icon={PlayCircle}
            color="emerald"
            description={`de ${overview.campaigns.total} total`}
          />
          <StatsCard
            title="ROAS Médio"
            value={`${overview.performance.avgRoas.toFixed(2)}x`}
            icon={TrendingUp}
            color="violet"
            description={`CTR: ${formatPercent(overview.performance.avgCtr)}`}
          />
          <StatsCard
            title="Investimento"
            value={formatCurrency(overview.performance.totalSpend)}
            icon={DollarSign}
            color="amber"
            description={`Receita: ${formatCurrency(overview.performance.totalRevenue)}`}
          />
        </div>

        {/* Métricas Secundárias */}
        <div className="grid gap-4 grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 bg-amber-500/10">
                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPL Médio</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(overview.performance.avgCpl)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-500/10">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversões</p>
                <p className="text-lg font-semibold">
                  {overview.performance.totalConversions.toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 bg-blue-500/10">
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leads Gerados</p>
                <p className="text-lg font-semibold">
                  {overview.performance.totalLeads.toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Principal */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Coluna Esquerda - 3/5 */}
          <div className="lg:col-span-3 space-y-6">
            {/* Distribuição por Plataforma */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Campanhas por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={platformData.length * 48 + 16}>
                    <BarChart
                      data={platformData}
                      layout="vertical"
                      margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} campanhas`, '']}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {platformData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhuma campanha cadastrada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Progresso BPMN */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Pipeline de Processos</CardTitle>
                <Badge variant="outline" className="font-normal">
                  Progresso médio {overview.bpmn.avgProgress}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Pipeline visual */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-blue-500/5 p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {overview.bpmn.clientsInExecution}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Em Execução</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <span>Nível 4</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-emerald-500/5 p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {overview.bpmn.clientsInMonitoring}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Monitoramento</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <span>Nível 5</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-red-500/5 p-4 text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {overview.bpmn.blockedClients}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Bloqueados</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>Atenção</span>
                    </div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progresso médio geral</span>
                    <span className="font-medium text-foreground">
                      {overview.bpmn.avgProgress}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        overview.bpmn.avgProgress >= 70
                          ? 'bg-emerald-500'
                          : overview.bpmn.avgProgress >= 40
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      )}
                      style={{ width: `${overview.bpmn.avgProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - 2/5 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clientes por Tier */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Clientes por Tier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tierData.length > 0 ? (
                  tierData
                    .sort((a, b) => b.value - a.value)
                    .map((tier) => (
                      <div key={tier.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{tier.name}</span>
                          <span className="font-medium">{tier.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(tier.value / totalTierClients) * 100}%`,
                              backgroundColor: tier.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum cliente cadastrado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Atividade Recente</CardTitle>
                <Badge variant="outline" className="font-normal">
                  {overview.reports.totalGenerated} relatórios
                </Badge>
              </CardHeader>
              <CardContent>
                {activityItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma atividade recente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activityItems.map((activity, index) => {
                      const isReport = activity.type === 'report';
                      return (
                        <div key={`${activity.type}-${index}`} className="flex gap-3">
                          <div
                            className={cn(
                              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                              isReport
                                ? 'bg-blue-500/10'
                                : 'bg-emerald-500/10'
                            )}
                          >
                            {isReport ? (
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {timeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
