'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { AdSetTable } from '@/components/performance/adset-table';
import { BudgetPacingCard } from '@/components/performance/budget-pacing-card';
import { BpmnProgressTracker } from '@/components/performance/bpmn-progress-tracker';
import { CampaignTable } from '@/components/performance/campaign-table';
import { CampaignTrendCard } from '@/components/performance/campaign-trend-card';
import { CreativeLibrary } from '@/components/performance/creative-library';
import { CreativePerformanceTable } from '@/components/performance/creative-performance-table';
import { DemographicsChart } from '@/components/performance/demographics-chart';
import { DiagnosticsPanel } from '@/components/performance/diagnostics-panel';
import { BusinessMetricsCard } from '@/components/performance/business-metrics-card';
import { WinnerLibrary } from '@/components/performance/winner-library';
import { CopyGenerator } from '@/components/performance/copy-generator';
import { AudienceInsights } from '@/components/performance/audience-insights';
import { CampaignHealthScores } from '@/components/performance/campaign-health-score';
import { KpiOverviewStrip } from '@/components/performance/kpi-overview-strip';
import { WeeklySummary } from '@/components/performance/weekly-summary';
import { LeadGenMetricsCard } from '@/components/performance/lead-gen-metrics-card';
import { LeadTrackingForm } from '@/components/performance/lead-tracking-form';
import { TemporalAnalysis } from '@/components/performance/temporal-analysis';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useClientPerformanceDashboard } from './use-client-performance-dashboard';
import { PerformanceDashboardHeader } from './components/dashboard-header';
import { LeadTrackingHistory } from './components/lead-tracking-history';

export default function ClientPerformancePage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [openReportGenerator, setOpenReportGenerator] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [creativeView, setCreativeView] = useState<'ads' | 'library'>('ads');

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
    regionData,
    countryData,
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
    metaSyncHistory,
    metaLastSuccessfulSync,
    metaSyncHistoryLoading,
    metaSyncMessage,
    metaSyncPercent,
    metaSyncRange,
    metaCoverage,
    creativeCoverage,
    creativeCoverageDetails,
    messagingMetrics,
    healthMetrics,
  } = useClientPerformanceDashboard(clientId);

  const selectedCampaignHasDelivery = Boolean(
    selectedCampaignId &&
    selectedCampaign &&
    ((selectedCampaign.totalSpend ?? 0) > 0 ||
      (selectedCampaign.totalMessagingConversations ?? 0) > 0 ||
      (selectedCampaign.totalImpressions ?? 0) > 0)
  );

  const roi = businessData?.roi ?? null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando performance...</p>
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
              <CardTitle className="text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error ?? 'Cliente não encontrado'}</p>
              <Button asChild className="mt-4">
                <Link href="/clients">Voltar para clientes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── HEADER ─── */}
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
          metaSyncHistory={metaSyncHistory}
          metaSyncMessage={metaSyncMessage}
          metaSyncPercent={metaSyncPercent}
          metaSyncRange={metaSyncRange}
          campaigns={summary.campaigns.map((c) => ({
            campaignId: c.campaignId,
            campaignName: c.campaignName,
          }))}
          selectedCampaignId={selectedCampaignId}
          setSelectedCampaignId={setSelectedCampaignId}
          showTrackingForm={showTrackingForm}
          onToggleTrackingForm={() => setShowTrackingForm((prev) => !prev)}
          onOpenReportGenerator={() => setOpenReportGenerator(true)}
          error={error}
          setError={setError}
        />

        {/* ─── 1. KPI OVERVIEW STRIP ─── */}
        <KpiOverviewStrip
          totalSpend={messagingMetrics.totalSpend}
          totalConversations={messagingMetrics.totalMessagingConversations}
          totalFirstReply={messagingMetrics.totalMessagingFirstReply}
          avgFrequency={healthMetrics.avgFrequency}
          roi={roi}
          loading={businessLoading || metricsLoading}
        />

        {/* ─── 1.5 RESUMO SEMANAL ─── */}
        <WeeklySummary clientId={clientId!} />

        {/* ─── 1.6 FUNIL & NEGÓCIO ─── */}
        {selectedCampaignId ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <LeadGenMetricsCard
              totalMessagingConversations={messagingMetrics.totalMessagingConversations}
              totalMessagingFirstReply={messagingMetrics.totalMessagingFirstReply}
              totalLinkClicks={messagingMetrics.totalLinkClicks}
              totalSpend={messagingMetrics.totalSpend}
              hasManualTracking={leadTrackingData.length > 0}
              qualifiedLeads={aggregatedLeadData.qualifiedLeads}
              disqualificationReasons={aggregatedLeadData.disqualificationReasons}
              contractsClosed={aggregatedLeadData.contractsClosed}
              totalRevenue={aggregatedLeadData.totalRevenue}
            />
            <BusinessMetricsCard data={businessData} loading={businessLoading} />
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
              Selecione uma campanha para visualizar métricas de funil e negócio.
            </CardContent>
          </Card>
        )}

        {/* ─── 2. BUDGET PACING + TENDÊNCIA (2 cols) ─── */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BudgetPacingCard clientId={clientId} />
          </div>
          <div className="lg:col-span-3">
            <CampaignTrendCard
              campaignName={selectedCampaign?.campaignName ?? null}
              dailyMetrics={dailyMetrics}
              metricsLoading={metricsLoading}
              totalReach={healthMetrics.totalReach}
              avgCpm={healthMetrics.avgCpm}
              totalImpressions={healthMetrics.totalImpressions}
              qualityRanking={healthMetrics.qualityRanking}
              engagementRateRanking={healthMetrics.engagementRateRanking}
              conversionRateRanking={healthMetrics.conversionRateRanking}
              hasDelivery={selectedCampaignHasDelivery}
            />
          </div>
        </div>

        {/* ─── 2.5 HEALTH SCORE ─── */}
        <CampaignHealthScores clientId={clientId!} />

        {/* ─── 3. DIAGNÓSTICO & AÇÕES ─── */}
        <DiagnosticsPanel
          clientId={clientId}
          optimizationData={optimizationData}
          optimizationLoading={optimizationLoading}
          metricsQuery={metricsQuery}
          selectedCampaignId={selectedCampaignId}
        />

        {/* ─── Tracking Form (Conditional) ─── */}
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

        {/* ─── 4. DETALHES (Tabs) ─── */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="flex-wrap h-auto w-full justify-start">
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="adsets">Conjuntos</TabsTrigger>
            <TabsTrigger value="creatives">Criativos</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
            <TabsTrigger value="breakdowns">Público & Tempo</TabsTrigger>
            <TabsTrigger value="funnel">Funil</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {metricsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <CampaignTable campaigns={summary.campaigns} />
            )}
          </TabsContent>

          <TabsContent value="adsets">
            {!selectedCampaignId ? (
              <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                Selecione uma campanha no topo para visualizar conjuntos.
              </div>
            ) : selectedCampaignHasDelivery ? (
              <AdSetTable adsets={adsetData} loading={adsetLoading} />
            ) : (
              <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-sm text-muted-foreground bg-muted/20">
                Sem dados de conjuntos para esta campanha no período.
              </div>
            )}
          </TabsContent>

          <TabsContent value="creatives" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-lg border bg-muted p-1 text-muted-foreground">
                <button
                  type="button"
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${creativeView === 'ads' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'}`}
                  onClick={() => setCreativeView('ads')}
                >
                  Anúncios
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${creativeView === 'library' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'}`}
                  onClick={() => setCreativeView('library')}
                >
                  Biblioteca
                </button>
              </div>
            </div>

            {creativeView === 'ads' ? (
              !selectedCampaignId ? (
                <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                  Selecione uma campanha no topo para visualizar anúncios.
                </div>
              ) : selectedCampaignHasDelivery ? (
                <CreativePerformanceTable ads={adCreativeData} loading={adCreativeLoading} creativeLibraryData={creativeLibraryData} />
              ) : (
                <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-sm text-muted-foreground bg-muted/20">
                  Sem dados de anúncios para esta campanha no período.
                </div>
              )
            ) : (
              <CreativeLibrary
                data={creativeLibraryData}
                loading={creativeLibraryLoading}
                scope={creativeLibraryScope}
                hasCampaignSelected={Boolean(selectedCampaignId)}
                onScopeChange={setCreativeLibraryScope}
                creativeCoverage={creativeCoverage}
                creativeCoverageDetails={creativeCoverageDetails}
              />
            )}
          </TabsContent>

          <TabsContent value="winners" className="space-y-4">
            <WinnerLibrary clientId={clientId!} />
            <CopyGenerator clientId={clientId!} />
          </TabsContent>

          <TabsContent value="breakdowns" className="space-y-4">
            {!selectedCampaignId ? (
              <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                Selecione uma campanha no topo para visualizar breakdowns.
              </div>
            ) : selectedCampaignHasDelivery ? (
              <>
                <AudienceInsights clientId={clientId!} campaignId={selectedCampaignId} />
                <DemographicsChart
                  ageGenderData={ageGenderData}
                  placementData={placementData}
                  regionData={regionData}
                  countryData={countryData}
                  loading={breakdownLoading}
                />
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
                    description="Resumo por dia da semana nos últimos 7 dias."
                    data={temporalLastWeekData?.byDayOfWeek || []}
                    bestDay={temporalLastWeekData?.bestDay || null}
                    worstDay={temporalLastWeekData?.worstDay || null}
                    cheapestDay={temporalLastWeekData?.cheapestDay || null}
                    mostExpensiveDay={temporalLastWeekData?.mostExpensiveDay || null}
                    loading={temporalLastWeekLoading}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-sm text-muted-foreground bg-muted/20">
                Sem dados demográficos e temporais para esta campanha no período.
              </div>
            )}
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            {selectedCampaignId && selectedCampaign ? (
              <>
                <LeadTrackingForm
                  campaignId={selectedCampaignId}
                  campaignName={selectedCampaign.campaignName}
                  onSuccess={() => reloadLeadTracking()}
                />
                {leadTrackingData.length > 0 && <LeadTrackingHistory records={leadTrackingData} />}
              </>
            ) : (
              <div className="flex items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                Selecione uma campanha no topo para registrar dados do funil.
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <BpmnProgressTracker progress={bpmnProgress} />
          </TabsContent>
        </Tabs>

        <ReportGenerator open={openReportGenerator} onClose={() => setOpenReportGenerator(false)} clientId={summary.clientId} clientName={summary.clientName} />
      </div>
    </div>
  );
}
