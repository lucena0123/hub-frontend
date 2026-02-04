'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Activity, RefreshCw } from 'lucide-react';

import { AdSetTable } from '@/components/performance/adset-table';
import { BpmnProgressTracker } from '@/components/performance/bpmn-progress-tracker';
import { BusinessMetricsCard } from '@/components/performance/business-metrics-card';
import { CampaignHealthCard } from '@/components/performance/campaign-health-card';
import { CampaignTable } from '@/components/performance/campaign-table';
import { CreativeLibrary } from '@/components/performance/creative-library';
import { CreativePerformanceTable } from '@/components/performance/creative-performance-table';
import { DemographicsChart } from '@/components/performance/demographics-chart';
import { LeadGenMetricsCard } from '@/components/performance/lead-gen-metrics-card';
import { LeadTrackingForm } from '@/components/performance/lead-tracking-form';
import { OptimizationCenter } from '@/components/performance/optimization-center';
import { PerformanceChart } from '@/components/performance/performance-chart';
import { TemporalAnalysis } from '@/components/performance/temporal-analysis';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useClientPerformanceDashboard } from './use-client-performance-dashboard';
import { PerformanceDashboardHeader } from './components/dashboard-header';
import { LeadTrackingHistory } from './components/lead-tracking-history';

export default function ClientPerformancePage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [openReportGenerator, setOpenReportGenerator] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);

  const {
    summary,
    bpmnProgress,
    dailyMetrics,
    leadTrackingData,
    aggregatedLeadData,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCampaign,
    period,
    setPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    metricsQuery,
    setMetricsQuery,
    resolvedRange,
    loading,
    metricsLoading,
    error,
    setError,
    lastUpdatedAt,
    refreshing,
    syncing,
    adsetData,
    adsetLoading,
    adCreativeData,
    adCreativeLoading,
    creativeLibraryScope,
    setCreativeLibraryScope,
    creativeLibraryData,
    creativeLibraryLoading,
    optimizationData,
    optimizationLoading,
    ageGenderData,
    placementData,
    breakdownLoading,
    temporalData,
    temporalLoading,
    temporalLastWeekData,
    temporalLastWeekLoading,
    businessData,
    businessLoading,
    refreshAll,
    reloadLeadTracking,
    handleMetaSync,
    metaAdAccountId,
    metaSyncDetails,
    metaLastSuccessfulSync,
    metaSyncHistoryLoading,
    metaSyncMessage,
    metaSyncPercent,
    metaSyncRange,
    metaCoverage,
    messagingMetrics,
    healthMetrics,
  } = useClientPerformanceDashboard(clientId);

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

  if (!summary) {
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
        <PerformanceDashboardHeader
          clientId={summary.clientId}
          clientName={summary.clientName}
          lastUpdatedAt={lastUpdatedAt}
          metaCoverage={metaCoverage}
          metaSyncHistoryLoading={metaSyncHistoryLoading}
          metaLastSuccessfulSync={metaLastSuccessfulSync}
          period={period}
          setPeriod={setPeriod}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          metricsQuery={metricsQuery}
          setMetricsQuery={setMetricsQuery}
          resolvedRange={resolvedRange}
          refreshing={refreshing}
          onRefreshAll={refreshAll}
          metaAdAccountId={metaAdAccountId}
          syncing={syncing}
          onMetaSync={handleMetaSync}
          metaSyncDetails={metaSyncDetails}
          metaSyncMessage={metaSyncMessage}
          metaSyncPercent={metaSyncPercent}
          metaSyncRange={metaSyncRange}
          selectedCampaignId={selectedCampaignId}
          showTrackingForm={showTrackingForm}
          onToggleTrackingForm={() => setShowTrackingForm((prev) => !prev)}
          onOpenReportGenerator={() => setOpenReportGenerator(true)}
          error={error}
          setError={setError}
        />

        <OptimizationCenter data={optimizationData} loading={optimizationLoading} />

        {selectedCampaignId && (
          <LeadGenMetricsCard
            totalMessagingConversations={messagingMetrics.totalMessagingConversations}
            totalMessagingFirstReply={messagingMetrics.totalMessagingFirstReply}
            totalLinkClicks={messagingMetrics.totalLinkClicks}
            totalSpend={messagingMetrics.totalSpend}
            hasManualTracking={leadTrackingData.length > 0}
            qualifiedLeads={aggregatedLeadData.qualifiedLeads}
            disqualificationReasons={Object.keys(aggregatedLeadData.disqualificationReasons).length > 0 ? aggregatedLeadData.disqualificationReasons : null}
            contractsClosed={aggregatedLeadData.contractsClosed}
            totalRevenue={aggregatedLeadData.totalRevenue}
          />
        )}

        {selectedCampaignId && (
          <CampaignHealthCard
            totalReach={healthMetrics.totalReach}
            avgFrequency={healthMetrics.avgFrequency}
            avgCpm={healthMetrics.avgCpm}
            totalImpressions={healthMetrics.totalImpressions}
            totalSpend={healthMetrics.totalSpend}
            qualityRanking={healthMetrics.qualityRanking}
            engagementRateRanking={healthMetrics.engagementRateRanking}
            conversionRateRanking={healthMetrics.conversionRateRanking}
          />
        )}

        {showTrackingForm && selectedCampaignId && selectedCampaign && (
          <LeadTrackingForm
            campaignId={selectedCampaignId}
            campaignName={selectedCampaign.campaignName}
            onSuccess={() => {
              setShowTrackingForm(false);
              reloadLeadTracking();
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
                <Select value={selectedCampaignId ?? undefined} onValueChange={(value) => setSelectedCampaignId(value)}>
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
            ) : !selectedCampaignId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Sem entrega no período selecionado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma campanha teve entrega (gasto, impressões ou conversas) no período atual. Ajuste o período, selecione uma campanha ou rode um sync full da Meta.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="default"
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={handleMetaSync}
                      disabled={syncing || !metaAdAccountId.trim()}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Sincronizando...' : 'Sync Meta Ads (Full)'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PerformanceChart data={dailyMetrics} title="Tendência de Performance" />
            )}
          </div>

          <BpmnProgressTracker progress={bpmnProgress} />
        </div>

        {selectedCampaignId && leadTrackingData.length > 0 && <LeadTrackingHistory records={leadTrackingData} />}

        {selectedCampaignId && <AdSetTable adsets={adsetData} loading={adsetLoading} />}

        {selectedCampaignId && <CreativePerformanceTable ads={adCreativeData} loading={adCreativeLoading} />}

        <CreativeLibrary
          data={creativeLibraryData}
          loading={creativeLibraryLoading}
          scope={creativeLibraryScope}
          hasCampaignSelected={Boolean(selectedCampaignId)}
          onScopeChange={setCreativeLibraryScope}
        />

        {selectedCampaignId && (
          <DemographicsChart ageGenderData={ageGenderData} placementData={placementData} loading={breakdownLoading} />
        )}

        {selectedCampaignId && (
          <div className="grid gap-4 lg:grid-cols-2">
            <TemporalAnalysis
              title="Análise Temporal"
              badgeLabel="Período selecionado"
              data={temporalData?.byDayOfWeek || []}
              bestDay={temporalData?.bestDay || null}
              worstDay={temporalData?.worstDay || null}
              cheapestDay={temporalData?.cheapestDay || null}
              mostExpensiveDay={temporalData?.mostExpensiveDay || null}
              loading={temporalLoading}
            />
            <TemporalAnalysis
              title="Última semana"
              badgeLabel="Últimos 7 dias"
              description="Resumo por dia da semana nos últimos 7 dias (dentro do intervalo selecionado)."
              data={temporalLastWeekData?.byDayOfWeek || []}
              bestDay={temporalLastWeekData?.bestDay || null}
              worstDay={temporalLastWeekData?.worstDay || null}
              cheapestDay={temporalLastWeekData?.cheapestDay || null}
              mostExpensiveDay={temporalLastWeekData?.mostExpensiveDay || null}
              loading={temporalLastWeekLoading}
            />
          </div>
        )}

        {selectedCampaignId && <BusinessMetricsCard data={businessData} loading={businessLoading} />}

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

      <ReportGenerator open={openReportGenerator} onClose={() => setOpenReportGenerator(false)} clientId={summary.clientId} clientName={summary.clientName} />
    </div>
  );
}
