'use client';

import { Card, CardContent } from '@/components/ui/card';
import type {
  MetricsQuery,
  OptimizationCenterResponse,
} from '@/types';
import { HistoryTab } from './diagnostics-panel/history-tab';
import { DiagnosticsPanelHeader } from './diagnostics-panel/panel-header';
import { QueueTab } from './diagnostics-panel/queue-tab';
import { RecommendationsTab } from './diagnostics-panel/recommendations-tab';
import { SummaryBadges } from './diagnostics-panel/summary-badges';
import { useDiagnosticsPanelState } from './diagnostics-panel/use-diagnostics-panel-state';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DiagnosticsPanelProps {
  clientId: string | null | undefined;
  optimizationData: OptimizationCenterResponse | null;
  optimizationLoading?: boolean;
  metricsQuery?: MetricsQuery;
  selectedCampaignId?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DiagnosticsPanel({
  clientId,
  optimizationData,
  optimizationLoading,
  metricsQuery,
  selectedCampaignId,
}: DiagnosticsPanelProps) {
  const {
    tab,
    setTab,
    showAll,
    setShowAll,
    showInfo,
    toggleShowInfo,
    proposals,
    reasonsById,
    setReasonsById,
    queueLoading,
    generating,
    actingId,
    message,
    error,
    historyItems,
    historyLoading,
    historyError,
    summary,
    theme,
    focusItems,
    prioritizedItems,
    pendingCount,
    historyRange,
    refresh,
    loadHistory,
    handleGenerate,
    handleApprove,
    handleReject,
    handleExecute,
  } = useDiagnosticsPanelState({
    clientId,
    optimizationData,
    metricsQuery,
    selectedCampaignId,
  });

  return (
    <Card className="edge-card">
      <DiagnosticsPanelHeader
        tab={tab}
        summary={summary}
        theme={theme}
        playbookVersion={optimizationData?.playbookVersion}
        pendingCount={pendingCount}
        generating={generating}
        hasClient={Boolean(clientId)}
        onTabChange={setTab}
        onGenerate={handleGenerate}
      />

      <CardContent className="space-y-3">
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {tab === 'recommendations' && summary && (
          <SummaryBadges summary={summary} />
        )}

        {tab === 'recommendations' && (
          <RecommendationsTab
            focusItems={focusItems}
            optimizationLoading={optimizationLoading}
            prioritizedItems={prioritizedItems}
            setShowAll={setShowAll}
            showAll={showAll}
            showInfo={showInfo}
            toggleShowInfo={toggleShowInfo}
          />
        )}

        {tab === 'queue' && (
          <QueueTab
            actingId={actingId}
            handleApprove={handleApprove}
            handleExecute={handleExecute}
            handleReject={handleReject}
            proposals={proposals}
            queueLoading={queueLoading}
            reasonsById={reasonsById}
            refresh={refresh}
            setReasonsById={setReasonsById}
          />
        )}

        {tab === 'history' && (
          <HistoryTab
            historyError={historyError}
            historyItems={historyItems}
            historyLoading={historyLoading}
            historyRange={historyRange}
            loadHistory={loadHistory}
            selectedCampaignId={selectedCampaignId}
          />
        )}
      </CardContent>
    </Card>
  );
}

