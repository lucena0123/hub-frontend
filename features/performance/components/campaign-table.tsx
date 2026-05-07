'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PerformanceSummary } from '@/types';
import { CampaignCard } from './campaign-table/campaign-card';
import { useCampaignTableState } from './campaign-table/use-campaign-table-state';

interface CampaignTableProps {
  clientId: string;
  campaigns: PerformanceSummary[];
}

export function CampaignTable({ campaigns, clientId }: CampaignTableProps) {
  const {
    themeOptions,
    themeLoading,
    themeError,
    subthemeDrafts,
    setSubthemeDrafts,
    saveState,
    benchmarkMap,
    benchmarkPeriod,
    benchmarkError,
    complianceMap,
    complianceSummary,
    complianceError,
    alertScoreByCampaign,
    handleThemeChange,
    handleSubthemeSave,
    resolveThemeKey,
    resolveSubthemeKey,
    sortedCampaigns,
  } = useCampaignTableState({ campaigns, clientId });

  return (
    <Card className="edge-card border-l-2 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance por Campanha
          <Badge variant="outline">Campanhas</Badge>
        </CardTitle>
        {themeError && (
          <p className="text-xs text-rose-600">{themeError}</p>
        )}
        {benchmarkError && (
          <p className="text-xs text-rose-600">{benchmarkError}</p>
        )}
        {benchmarkPeriod && (
          <p className="text-xs text-muted-foreground">
            Baseline interno: {benchmarkPeriod.start} → {benchmarkPeriod.end} (CPL/CTR)
          </p>
        )}
        {complianceError && (
          <p className="text-xs text-rose-600">{complianceError}</p>
        )}
        {complianceSummary && (
          <div className="flex flex-wrap items-center gap-2">
            {complianceSummary.critical > 0 && (
              <Badge className="bg-rose-500 text-white text-xs">
                compliance crítico: {complianceSummary.critical}
              </Badge>
            )}
            {complianceSummary.warning > 0 && (
              <Badge className="bg-amber-400 text-amber-950 text-xs">
                compliance alerta: {complianceSummary.warning}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              Nenhuma campanha encontrada
            </div>
          ) : (
            sortedCampaigns.map((campaign, index) => (
              <CampaignCard
                key={campaign.campaignId}
                alertScoreByCampaign={alertScoreByCampaign}
                benchmarkMap={benchmarkMap}
                campaign={campaign}
                clientId={clientId}
                complianceMap={complianceMap}
                handleSubthemeSave={handleSubthemeSave}
                handleThemeChange={handleThemeChange}
                index={index}
                resolveSubthemeKey={resolveSubthemeKey}
                resolveThemeKey={resolveThemeKey}
                saveInfo={saveState[campaign.campaignId]}
                setSubthemeDrafts={setSubthemeDrafts}
                subthemeDraft={subthemeDrafts[campaign.campaignId]}
                themeLoading={themeLoading}
                themeOptions={themeOptions}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
