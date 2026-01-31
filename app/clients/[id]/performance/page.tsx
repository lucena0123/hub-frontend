'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Activity, BarChart3, TrendingUp, FileText } from 'lucide-react';
import {
  getCampaignMetrics,
  getClientBpmnProgress,
  getClientPerformanceSummary,
} from '@/lib/api/client';
import type { ClientPerformanceSummary, DailyMetric, MetricsPeriod, BPMNProgress } from '@/types';
import { MetricsCard } from '@/components/performance/metrics-card';
import { PerformanceChart } from '@/components/performance/performance-chart';
import { BpmnProgressTracker } from '@/components/performance/bpmn-progress-tracker';
import { CampaignTable } from '@/components/performance/campaign-table';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const periodOptions: Array<{ value: MetricsPeriod; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
];

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `$${value.toLocaleString()}`;
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(2)}%`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString();
};

export default function ClientPerformancePage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [summary, setSummary] = useState<ClientPerformanceSummary | null>(null);
  const [bpmnProgress, setBpmnProgress] = useState<BPMNProgress | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricsPeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReportGenerator, setOpenReportGenerator] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        const [summaryData, progressData] = await Promise.all([
          getClientPerformanceSummary(String(clientId)),
          getClientBpmnProgress(String(clientId)),
        ]);
        setSummary(summaryData);
        setBpmnProgress(progressData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [clientId]);

  useEffect(() => {
    if (!summary || summary.campaigns.length === 0) {
      setDailyMetrics([]);
      return;
    }

    if (!selectedCampaignId) {
      setSelectedCampaignId(summary.campaigns[0].campaignId);
    }
  }, [summary, selectedCampaignId]);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!selectedCampaignId) return;

      try {
        setMetricsLoading(true);
        const metrics = await getCampaignMetrics(selectedCampaignId, period);
        setDailyMetrics(metrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign metrics');
      } finally {
        setMetricsLoading(false);
      }
    };

    loadMetrics();
  }, [selectedCampaignId, period]);

  const selectedCampaign = useMemo(() => {
    return summary?.campaigns.find((campaign) => campaign.campaignId === selectedCampaignId);
  }, [summary, selectedCampaignId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error ?? 'Client not found'}</p>
              <Button asChild className="mt-4">
                <Link href="/clients">Back to clients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const cpa = summary.totalConversions > 0
    ? summary.totalSpend / summary.totalConversions
    : 0;

  const trend = summary.vsLastPeriod;
  const toFactor = (value?: number) => (value === undefined ? undefined : 1 + value / 100);

  const cpaTrend = (() => {
    if (trend?.spend === undefined || trend?.conversions === undefined) return undefined;
    const spendFactor = toFactor(trend.spend);
    const conversionsFactor = toFactor(trend.conversions);
    if (!spendFactor || !conversionsFactor || conversionsFactor === 0) return undefined;
    return ((spendFactor / conversionsFactor) - 1) * 100;
  })();

  const ctrTrend = (() => {
    if (trend?.clicks === undefined || trend?.impressions === undefined) return undefined;
    const clicksFactor = toFactor(trend.clicks);
    const impressionsFactor = toFactor(trend.impressions);
    if (!clicksFactor || !impressionsFactor || impressionsFactor === 0) return undefined;
    return ((clicksFactor / impressionsFactor) - 1) * 100;
  })();

  const cards = [
    {
      title: 'CPL',
      value: formatCurrency(summary.avgCpl),
      icon: TrendingUp,
    },
    {
      title: 'CPA',
      value: formatCurrency(cpa),
      icon: TrendingUp,
      trend: cpaTrend !== undefined ? { value: cpaTrend, label: 'vs last' } : undefined,
    },
    {
      title: 'ROAS',
      value: summary.avgRoas.toFixed(2) + 'x',
      icon: BarChart3,
      trend: trend?.roas !== undefined ? { value: trend.roas, label: 'vs last' } : undefined,
    },
    {
      title: 'CTR',
      value: formatPercent(summary.avgCtr),
      icon: Activity,
      trend: ctrTrend !== undefined ? { value: ctrTrend, label: 'vs last' } : undefined,
    },
    {
      title: 'Gastos total',
      value: formatCurrency(summary.totalSpend),
      subtitle: `Revenue: ${formatCurrency(summary.totalRevenue)}`,
      icon: TrendingUp,
      trend: trend?.spend !== undefined ? { value: trend.spend, label: 'vs last' } : undefined,
    },
    {
      title: 'Conversoes',
      value: formatNumber(summary.totalConversions),
      subtitle: `Clicks: ${formatNumber(summary.totalClicks)}`,
      icon: TrendingUp,
      trend: trend?.conversions !== undefined ? { value: trend.conversions, label: 'vs last' } : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href={`/clients/${summary.clientId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Performance dashboard</h1>
              <p className="text-muted-foreground">{summary.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as MetricsPeriod)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setOpenReportGenerator(true)}
            >
              <FileText className="h-4 w-4" />
              Gerar Relatorio Mensal
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <MetricsCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Campaign trend</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCampaign ? selectedCampaign.campaignName : 'No campaign selected'}
                </p>
              </div>
              {summary.campaigns.length > 1 && (
                <Select
                  value={selectedCampaignId ?? undefined}
                  onValueChange={(value) => setSelectedCampaignId(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {summary.campaigns.map((campaign) => (
                      <SelectItem key={campaign.campaignId} value={campaign.campaignId}>
                        {campaign.campaignName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {metricsLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Loading metrics...</CardTitle>
                </CardHeader>
                <CardContent className="flex h-[320px] items-center justify-center">
                  <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <PerformanceChart data={dailyMetrics} title="Performance trend" />
            )}
          </div>
          <BpmnProgressTracker progress={bpmnProgress} />
        </div>

        {metricsLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading campaigns...</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-10">
              <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <CampaignTable campaigns={summary.campaigns} />
        )}
      </div>

      <ReportGenerator
        open={openReportGenerator}
        onClose={() => setOpenReportGenerator(false)}
        clientId={summary.clientId}
        clientName={summary.clientName}
      />
    </div>
  );
}
