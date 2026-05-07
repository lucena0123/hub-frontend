import type { Dispatch, SetStateAction } from 'react';
import type { CampaignBenchmark, ComplianceRiskCampaign, PerformanceSummary } from '@/types';
import { CampaignBudgetSection } from './budget-section';
import { CampaignCardHeader } from './campaign-card-header';
import { buildCampaignView } from './campaign-view';
import { CampaignKpiSection } from './kpi-section';
import { CampaignLearningSection } from './learning-section';
import { CampaignPyramidSection } from './pyramid-section';
import { CampaignRankingSection } from './ranking-section';
import { CampaignThemeControls } from './theme-controls';
import { AUTO_THEME_VALUE, type SaveState, type ThemeOption } from './use-campaign-table-state';

interface CampaignCardProps {
  alertScoreByCampaign: Record<string, number>;
  benchmarkMap: Record<string, CampaignBenchmark>;
  campaign: PerformanceSummary;
  clientId: string;
  complianceMap: Record<string, ComplianceRiskCampaign>;
  handleSubthemeSave: (campaignId: string) => void;
  handleThemeChange: (campaignId: string, value: string) => void;
  index: number;
  resolveSubthemeKey: (campaign: PerformanceSummary) => string | null;
  resolveThemeKey: (campaign: PerformanceSummary) => string | null;
  saveInfo?: SaveState;
  setSubthemeDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  subthemeDraft: string | undefined;
  themeLoading: boolean;
  themeOptions: ThemeOption[];
}

export function CampaignCard({
  alertScoreByCampaign,
  benchmarkMap,
  campaign,
  clientId,
  complianceMap,
  handleSubthemeSave,
  handleThemeChange,
  index,
  resolveSubthemeKey,
  resolveThemeKey,
  saveInfo,
  setSubthemeDrafts,
  subthemeDraft,
  themeLoading,
  themeOptions,
}: CampaignCardProps) {
  const themeKey = resolveThemeKey(campaign);
  const subthemeKey = resolveSubthemeKey(campaign);
  const draftSubtheme = subthemeDraft ?? subthemeKey ?? '';
  const isSaving = saveInfo?.status === 'saving';
  const normalizedSavedSubtheme = (subthemeKey ?? '').trim();
  const normalizedDraftSubtheme = draftSubtheme.trim();
  const subthemeDirty = normalizedDraftSubtheme !== normalizedSavedSubtheme;
  const themeSelectValue = themeKey ?? AUTO_THEME_VALUE;
  const themeDisabled = themeLoading || themeOptions.length === 0 || isSaving;
  const {
    advancedKpis,
    benchmarkMessage,
    budgetBase,
    budgetBaseLabel,
    budgetPeriod,
    budgetRemaining,
    budgetStatus,
    budgetUsed,
    budgetUtilization,
    complianceBadge,
    complianceTooltip,
    conversionMeta,
    conversionReason,
    engagementMeta,
    engagementReason,
    hasBudgetInfo,
    insightMessage,
    isDailyBudget,
    isTopPriority,
    kpiCards,
    priorityMeta,
    priorityScore,
    pyramidLayers,
    qualityMeta,
    qualityReason,
    showZeroConversations,
  } = buildCampaignView({
    campaign,
    index,
    benchmarkMap,
    complianceMap,
    alertScoreByCampaign,
  });

  return (
    <div
      className={`rounded-[16px] border bg-card/70 p-5 ${
        isTopPriority
          ? 'border-rose-500/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35),0_0_24px_rgba(244,63,94,0.18)]'
          : 'border-border/60'
      }`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          <CampaignCardHeader
            campaign={campaign}
            clientId={clientId}
            complianceBadge={complianceBadge}
            complianceTooltip={complianceTooltip}
            isTopPriority={isTopPriority}
            priorityMeta={priorityMeta}
            priorityScore={priorityScore}
            showZeroConversations={showZeroConversations}
          />

          <CampaignRankingSection
            campaign={campaign}
            qualityMeta={qualityMeta}
            engagementMeta={engagementMeta}
            conversionMeta={conversionMeta}
            qualityReason={qualityReason}
            engagementReason={engagementReason}
            conversionReason={conversionReason}
            benchmarkMessage={benchmarkMessage}
            insightMessage={insightMessage}
          />

          <CampaignLearningSection learningSummary={campaign.learningSummary} />
        </div>

        <CampaignPyramidSection pyramidLayers={pyramidLayers} />

        <CampaignKpiSection advancedKpis={advancedKpis} kpiCards={kpiCards} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CampaignThemeControls
          campaignId={campaign.campaignId}
          clientId={clientId}
          draftSubtheme={draftSubtheme}
          handleSubthemeSave={handleSubthemeSave}
          handleThemeChange={handleThemeChange}
          isSaving={isSaving}
          saveInfo={saveInfo}
          setSubthemeDrafts={setSubthemeDrafts}
          subthemeDirty={subthemeDirty}
          themeDisabled={themeDisabled}
          themeKey={themeKey}
          themeOptions={themeOptions}
          themeSelectValue={themeSelectValue}
        />

        <CampaignBudgetSection
          budgetBase={budgetBase}
          budgetBaseLabel={budgetBaseLabel}
          budgetPeriod={budgetPeriod}
          budgetRemaining={budgetRemaining}
          budgetStatus={budgetStatus}
          budgetUsed={budgetUsed}
          budgetUtilization={budgetUtilization}
          hasBudgetInfo={hasBudgetInfo}
          isDailyBudget={isDailyBudget}
        />
      </div>
    </div>
  );
}
