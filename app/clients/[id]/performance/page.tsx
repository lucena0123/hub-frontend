'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Activity, BarChart3, TrendingUp, FileText, PlusCircle } from 'lucide-react';
import {
  getCampaignMetrics,
  getClientBpmnProgress,
  getClientPerformanceSummary,
  getLeadTracking,
} from '@/lib/api/client';
import type { ClientPerformanceSummary, DailyMetric, MetricsPeriod, BPMNProgress, LeadTrackingData } from '@/types';
import { MetricsCard } from '@/components/performance/metrics-card';
import { PerformanceChart } from '@/components/performance/performance-chart';
import { BpmnProgressTracker } from '@/components/performance/bpmn-progress-tracker';
import { CampaignTable } from '@/components/performance/campaign-table';
import { LeadGenMetricsCard } from '@/components/performance/lead-gen-metrics-card';
import { LeadTrackingForm } from '@/components/performance/lead-tracking-form';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const periodOptions: Array<{ value: MetricsPeriod; label: string }> = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '14d', label: 'Últimos 14 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
];

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
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
  const [leadTrackingData, setLeadTrackingData] = useState<LeadTrackingData[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricsPeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReportGenerator, setOpenReportGenerator] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);

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

  useEffect(() => {
    if (!selectedCampaignId) return;
    loadLeadTracking(selectedCampaignId);
  }, [selectedCampaignId, period]);

  const loadLeadTracking = async (campaignId: string) => {
    try {
      const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const data = await getLeadTracking(campaignId, { startDate, endDate });
      setLeadTrackingData(data);
    } catch (err) {
      console.error('Error loading lead tracking:', err);
      setLeadTrackingData([]);
    }
  };

  const selectedCampaign = useMemo(() => {
    return summary?.campaigns.find((campaign) => campaign.campaignId === selectedCampaignId);
  }, [summary, selectedCampaignId]);

  // Calculate aggregated lead tracking data
  const aggregatedLeadData = useMemo(() => {
    return leadTrackingData.reduce(
      (acc, curr) => ({
        qualifiedLeads: acc.qualifiedLeads + (curr.qualifiedLeads || 0),
        contractsClosed: acc.contractsClosed + (curr.contractsClosed || 0),
        totalRevenue: acc.totalRevenue + (curr.revenueGenerated || 0),
        roi: curr.roi || acc.roi,
      }),
      { qualifiedLeads: 0, contractsClosed: 0, totalRevenue: 0, roi: 0 }
    );
  }, [leadTrackingData]);

  // Get messaging metrics from selected campaign or summary
  const messagingMetrics = useMemo(() => {
    if (selectedCampaign && selectedCampaignId) {
      // Get from the selected campaign's performance summary
      const campaignData = summary?.campaigns.find(c => c.campaignId === selectedCampaignId);
      if (campaignData) {
        return {
          totalMessagingConversations: campaignData.totalMessagingConversations || 0,
          totalMessagingFirstReply: campaignData.totalMessagingFirstReply || 0,
          totalLinkClicks: campaignData.totalLinkClicks || 0,
          totalSpend: campaignData.totalSpend || 0,
        };
      }
    }

    // Fallback to summary totals
    return {
      totalMessagingConversations: summary?.totalMessagingConversations || 0,
      totalMessagingFirstReply: summary?.totalMessagingFirstReply || 0,
      totalLinkClicks: summary?.totalLinkClicks || 0,
      totalSpend: summary?.totalSpend || 0,
    };
  }, [selectedCampaign, selectedCampaignId, summary]);

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
              <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
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
            {selectedCampaignId && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowTrackingForm(!showTrackingForm)}
              >
                <PlusCircle className="h-4 w-4" />
                {showTrackingForm ? 'Ocultar' : 'Adicionar'} Dados do Funil
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setOpenReportGenerator(true)}
            >
              <FileText className="h-4 w-4" />
              Gerar Relatório Mensal
            </Button>
          </div>
        </div>

        {/* Lead Generation Metrics Card */}
        {selectedCampaignId && (
          <LeadGenMetricsCard
            totalMessagingConversations={messagingMetrics.totalMessagingConversations}
            totalMessagingFirstReply={messagingMetrics.totalMessagingFirstReply}
            totalLinkClicks={messagingMetrics.totalLinkClicks}
            totalSpend={messagingMetrics.totalSpend}
            qualifiedLeads={aggregatedLeadData.qualifiedLeads}
            contractsClosed={aggregatedLeadData.contractsClosed}
            totalRevenue={aggregatedLeadData.totalRevenue}
            roi={aggregatedLeadData.roi}
          />
        )}

        {/* Lead Tracking Form */}
        {showTrackingForm && selectedCampaignId && selectedCampaign && (
          <LeadTrackingForm
            campaignId={selectedCampaignId}
            campaignName={selectedCampaign.campaignName}
            onSuccess={() => {
              setShowTrackingForm(false);
              loadLeadTracking(selectedCampaignId);
            }}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Tendência da Campanha</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCampaign ? selectedCampaign.campaignName : 'Nenhuma campanha selecionada'}
                </p>
              </div>
              {summary.campaigns.length > 1 && (
                <Select
                  value={selectedCampaignId ?? undefined}
                  onValueChange={(value) => setSelectedCampaignId(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Selecione campanha" />
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
                  <CardTitle>Carregando métricas...</CardTitle>
                </CardHeader>
                <CardContent className="flex h-[320px] items-center justify-center">
                  <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <PerformanceChart data={dailyMetrics} title="Tendência de Performance" />
            )}
          </div>
          <BpmnProgressTracker progress={bpmnProgress} />
        </div>

        {/* Lead Tracking History */}
        {selectedCampaignId && leadTrackingData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Funil Manual</CardTitle>
              <CardDescription>Dados de qualificação e fechamento inseridos manualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadTrackingData.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-medium">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                        <p className="font-medium">{record.qualifiedLeads}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contratos Fechados</p>
                        <p className="font-medium">{record.contractsClosed}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Receita</p>
                        <p className="font-medium">R$ {record.revenueGenerated.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROI</p>
                        <p className="font-medium text-green-600">{record.roi ? `${record.roi.toFixed(0)}%` : '—'}</p>
                      </div>
                    </div>
                    {record.notes && (
                      <p className="text-sm text-muted-foreground max-w-xs truncate">{record.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {metricsLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Carregando campanhas...</CardTitle>
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
