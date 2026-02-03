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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

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

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data: unknown = await getDashboardOverview();
        if (!isDashboardOverview(data)) {
          throw new Error(
            'Unexpected dashboard response. Check NEXT_PUBLIC_API_URL and ensure the Fastify backend is running.'
          );
        }
        setOverview(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure the Fastify backend is running and NEXT_PUBLIC_API_URL points to it (e.g. http://localhost:3003)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return '-';
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => {
    if (!Number.isFinite(value)) return '-';
    return `${value.toFixed(2)}%`;
  };

  const activityItems = overview?.recentActivity ?? [];

  const formattedLastReport = formatDate(overview?.reports?.lastGenerated, 'MMM dd, yyyy');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BPMN System Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your business processes and campaigns
          </p>
        </div>

        {/* Stats Grid */}
        {overview && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Clients"
                value={overview.clients.total}
                icon={Users}
                description={`${overview.clients.active} active`}
              />
              <StatsCard
                title="Campanhas Ativas"
                value={overview.campaigns.active}
                icon={PlayCircle}
                description={`Total: ${overview.campaigns.total}`}
              />
              <StatsCard
                title="ROAS Medio"
                value={`${overview.performance.avgRoas.toFixed(2)}x`}
                icon={BarChart3}
                description={`CTR: ${formatPercent(overview.performance.avgCtr)}`}
              />
              <StatsCard
                title="Investimento Total"
                value={formatCurrency(overview.performance.totalSpend)}
                icon={DollarSign}
                description={`Revenue: ${formatCurrency(overview.performance.totalRevenue)}`}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>BPMN Progress</CardTitle>
                  <Badge variant="outline">
                    Avg {overview.bpmn.avgProgress}%
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Em execucao</p>
                      <p className="text-2xl font-semibold">{overview.bpmn.clientsInExecution}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Em monitoramento</p>
                      <p className="text-2xl font-semibold">{overview.bpmn.clientsInMonitoring}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Bloqueados</p>
                      <p className="text-2xl font-semibold">{overview.bpmn.blockedClients}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Leads</p>
                      <p className="text-2xl font-semibold">{overview.performance.totalLeads}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progresso medio</span>
                      <span>{overview.bpmn.avgProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${overview.bpmn.avgProgress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Last report: {formattedLastReport}
                    </p>
                  </div>
                  <Badge variant="outline">
                    Reports {overview?.reports?.totalGenerated ?? 0}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {activityItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No recent activity yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityItems.map((activity, index) => {
                        const icon =
                          activity.type === 'report'
                            ? FileText
                            : activity.type === 'bpmn'
                              ? Activity
                              : Activity;
                        const Icon = icon;
                        const activityTimestamp = formatDate(
                          activity.timestamp,
                          'MMM dd, HH:mm'
                        );

                        return (
                          <div key={`${activity.type}-${index}`} className="flex gap-3">
                            <div className="mt-0.5 rounded-full bg-muted p-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">{activityTimestamp}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
