'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChart3, Gauge, Layers, Loader2, Sparkles, TrendingUp } from 'lucide-react';

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
import { AiInsightsPanel } from '@/components/performance/ai-insights-panel';
import { SectionHeader } from '@/components/performance/section-header';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';

import { useClientPerformanceDashboard } from './use-client-performance-dashboard';
import { PerformanceDashboardHeader } from './components/dashboard-header';
import { LeadTrackingHistory } from './components/lead-tracking-history';
import { PerformanceSidebar } from './components/performance-sidebar';

type DashboardTab = 'executive' | 'operation' | 'analysis';
type AnalysisTab = 'campaigns' | 'adsets' | 'creatives' | 'breakdowns' | 'business' | 'funnel' | 'progress';

export default function ClientPerformancePage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [openReportGenerator, setOpenReportGenerator] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [creativeView, setCreativeView] = useState<'ads' | 'library'>('ads');
  const [activeTab, setActiveTab] = useState<DashboardTab>('executive');
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('campaigns');

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
  const trendMetrics = selectedCampaignId ? dailyMetrics : summary?.dailyMetrics ?? [];
  const trendCampaignName = selectedCampaign?.campaignName ?? 'Tendência geral';
  const trendHasDelivery = selectedCampaignId
    ? selectedCampaignHasDelivery
    : Boolean(
        (summary?.totalSpend ?? 0) > 0 ||
          (summary?.totalMessagingConversations ?? 0) > 0 ||
          (summary?.totalImpressions ?? 0) > 0
      );
  const trendMetricsLoading = selectedCampaignId ? metricsLoading : false;
  const filteredCampaigns = selectedCampaignId
    ? summary?.campaigns.filter((campaign) => campaign.campaignId === selectedCampaignId) ?? []
    : summary?.campaigns ?? [];

  const handleToggleTrackingForm = () => {
    setShowTrackingForm((prev) => {
      const next = !prev;
      if (next) {
        setActiveTab('analysis');
        setAnalysisTab('funnel');
      }
      return next;
    });
  };

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
    <PageShell
      className="compact-shell"
      eyebrow={`Clientes / ${summary.clientId}`}
      title="Performance"
      description={`Visão tática de mídia, funil e receita para ${summary.clientName}.`}
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Campanhas {summary.campaigns.length}</div>
          <div className="signal-chip">Período {period.toUpperCase()}</div>
        </div>
      }
    >
      <Reveal>
        <div className="premium-toolbar">
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
            onToggleTrackingForm={handleToggleTrackingForm}
            onOpenReportGenerator={() => setOpenReportGenerator(true)}
            error={error}
            setError={setError}
          />
        </div>
      </Reveal>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DashboardTab)}
        orientation="vertical"
        className="w-full"
      >
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <PerformanceSidebar
            activeTab={activeTab}
            analysisTab={analysisTab}
            onAnalysisTabChange={setAnalysisTab}
          />

          <div className="space-y-8">
            <TabsContent value="executive">
              <div className="premium-canvas space-y-8">
                <div className="space-y-4">
                  <SectionHeader
                    title="KPIs do Período"
                    subtitle="Resumo executivo de investimento e conversas."
                    icon={TrendingUp}
                  />
                  <Reveal delayMs={80}>
                    <KpiOverviewStrip
                      totalSpend={messagingMetrics.totalSpend}
                      totalConversations={messagingMetrics.totalMessagingConversations}
                      totalFirstReply={messagingMetrics.totalMessagingFirstReply}
                      avgFrequency={healthMetrics.avgFrequency}
                      roi={roi}
                      loading={businessLoading || metricsLoading}
                    />
                  </Reveal>
                </div>

                <div className="space-y-4">
                  <SectionHeader
                    title="Performance de Leads"
                    subtitle="Correlação entre investimento, conversas e CPM."
                    icon={BarChart3}
                  />
                  <Reveal delayMs={120}>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <CampaignTrendCard
                        campaignName={trendCampaignName}
                        dailyMetrics={trendMetrics}
                        metricsLoading={trendMetricsLoading}
                        totalReach={healthMetrics.totalReach}
                        avgCpm={healthMetrics.avgCpm}
                        totalImpressions={healthMetrics.totalImpressions}
                        qualityRanking={healthMetrics.qualityRanking}
                        engagementRateRanking={healthMetrics.engagementRateRanking}
                        conversionRateRanking={healthMetrics.conversionRateRanking}
                        hasDelivery={trendHasDelivery}
                      />
                      <WeeklySummary clientId={clientId!} />
                    </div>
                  </Reveal>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operation">
              <div className="premium-canvas space-y-8">
                <div className="space-y-4">
                  <SectionHeader
                    title="Diagnóstico & Ações"
                    subtitle="Winners, alertas e decisões prioritárias."
                    icon={Sparkles}
                  />
                  <Reveal delayMs={80}>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <DiagnosticsPanel
                        clientId={clientId}
                        optimizationData={optimizationData}
                        optimizationLoading={optimizationLoading}
                        metricsQuery={metricsQuery}
                        selectedCampaignId={selectedCampaignId}
                      />
                      <AiInsightsPanel
                        campaignId={selectedCampaignId}
                        campaignName={selectedCampaign?.campaignName ?? null}
                        creativeLibraryData={creativeLibraryData}
                        periodRange={resolvedRange}
                      />
                    </div>
                  </Reveal>
                </div>

                <div className="space-y-4">
                  <SectionHeader
                    title="Pacing & Saúde"
                    subtitle="Controle de orçamento e saúde geral das campanhas."
                    icon={Gauge}
                  />
                  <Reveal delayMs={120}>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <BudgetPacingCard clientId={clientId} />
                      <CampaignHealthScores clientId={clientId!} />
                    </div>
                  </Reveal>
                </div>

                <div className="space-y-4">
                  <SectionHeader
                    title="Criativos & Copy"
                    subtitle="Top performers e novas variações com IA."
                    icon={Layers}
                  />
                  <Reveal delayMs={160}>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <WinnerLibrary clientId={clientId!} />
                      <CopyGenerator clientId={clientId!} />
                    </div>
                  </Reveal>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <div className="premium-canvas space-y-8">
                <Reveal delayMs={120}>
                  <Tabs value={analysisTab} onValueChange={(value) => setAnalysisTab(value as AnalysisTab)} className="space-y-6">

                    <SectionHeader
                      title="Detalhamento"
                      subtitle="Camadas de campanhas, conjuntos, criativos e público."
                      icon={BarChart3}
                    />

                    <TabsContent value="campaigns" className="space-y-4">
                      {metricsLoading ? (
                        <Card>
                          <CardContent className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <CampaignTable campaigns={filteredCampaigns} clientId={summary.clientId} />
                      )}
                    </TabsContent>

                      <TabsContent value="adsets">
                        {!selectedCampaignId ? (
                          <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-muted-foreground bg-muted/20">
                            Selecione uma campanha no topo para visualizar conjuntos.
                          </div>
                        ) : selectedCampaignHasDelivery ? (
                          <AdSetTable
                            adsets={adsetData}
                            loading={adsetLoading}
                            objective={selectedCampaign?.objective ?? null}
                            objectiveMeta={selectedCampaign?.objectiveMeta ?? null}
                          />
                        ) : (
                          <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-sm text-muted-foreground bg-muted/20">
                            Sem dados de conjuntos para esta campanha no período.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="creatives" className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center rounded-[2px] border bg-muted p-1 text-muted-foreground">
                            <button
                              type="button"
                              className={`inline-flex items-center rounded-[2px] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-all ${creativeView === 'ads' ? 'bg-background text-foreground' : 'hover:text-foreground'}`}
                              onClick={() => setCreativeView('ads')}
                            >
                              Anúncios
                            </button>
                            <button
                              type="button"
                              className={`inline-flex items-center rounded-[2px] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-all ${creativeView === 'library' ? 'bg-background text-foreground' : 'hover:text-foreground'}`}
                              onClick={() => setCreativeView('library')}
                            >
                              Biblioteca
                            </button>
                          </div>
                        </div>

                        {creativeView === 'ads' ? (
                          !selectedCampaignId ? (
                            <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-muted-foreground bg-muted/20">
                              Selecione uma campanha no topo para visualizar anúncios.
                            </div>
                          ) : selectedCampaignHasDelivery ? (
                            <CreativePerformanceTable
                              ads={adCreativeData}
                              loading={adCreativeLoading}
                              creativeLibraryData={creativeLibraryData}
                              objective={selectedCampaign?.objective ?? null}
                              objectiveMeta={selectedCampaign?.objectiveMeta ?? null}
                            />
                          ) : (
                            <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-sm text-muted-foreground bg-muted/20">
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
                            campaignId={selectedCampaignId}
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="breakdowns" className="space-y-4">
                        {!selectedCampaignId ? (
                          <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-muted-foreground bg-muted/20">
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
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
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
                          <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-sm text-muted-foreground bg-muted/20">
                            Sem dados demográficos e temporais para esta campanha no período.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="business" className="space-y-4">
                        {selectedCampaignId ? (
                          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)]">
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
                      </TabsContent>

                      <TabsContent value="funnel" className="space-y-4">
                        {selectedCampaignId && selectedCampaign ? (
                          <>
                            {showTrackingForm ? (
                              <LeadTrackingForm
                                campaignId={selectedCampaignId}
                                campaignName={selectedCampaign.campaignName}
                                onSuccess={() => {
                                  setShowTrackingForm(false);
                                  reloadLeadTracking();
                                }}
                              />
                            ) : (
                              <Card>
                                <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
                                  Use &quot;Dados do Funil&quot; para registrar entradas manuais.
                                </CardContent>
                              </Card>
                            )}
                            {leadTrackingData.length > 0 && <LeadTrackingHistory records={leadTrackingData} />}
                          </>
                        ) : (
                          <div className="flex items-center justify-center p-8 border rounded-[2px] border-dashed text-muted-foreground bg-muted/20">
                            Selecione uma campanha no topo para registrar dados do funil.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="progress">
                        <BpmnProgressTracker progress={bpmnProgress} />
                      </TabsContent>
                    </Tabs>
                </Reveal>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <ReportGenerator open={openReportGenerator} onClose={() => setOpenReportGenerator(false)} clientId={summary.clientId} clientName={summary.clientName} />
    </PageShell>
  );
}
