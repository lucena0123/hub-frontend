import { useEffect, useState } from 'react';

import { getOptimizationCenterPlaybook, updateCampaign } from '@/lib/api/client';
import type { PerformanceSummary } from '@/types';
import { useCampaignSignals } from './use-campaign-signals';

export const AUTO_THEME_VALUE = '__auto__';

export type ThemeOption = {
  key: string;
  name: string;
};

export type SaveState = {
  status: 'idle' | 'saving' | 'error';
  message?: string;
};

interface UseCampaignTableStateParams {
  campaigns: PerformanceSummary[];
  clientId: string;
}

export function useCampaignTableState({ campaigns, clientId }: UseCampaignTableStateParams) {
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
  const [themeLoading, setThemeLoading] = useState(true);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string | null>>({});
  const [subthemeOverrides, setSubthemeOverrides] = useState<Record<string, string | null>>({});
  const [subthemeDrafts, setSubthemeDrafts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const {
    alertScoreByCampaign,
    benchmarkError,
    benchmarkMap,
    benchmarkPeriod,
    complianceError,
    complianceMap,
    complianceSummary,
  } = useCampaignSignals({ campaigns, clientId });

  useEffect(() => {
    let active = true;

    const loadThemes = async () => {
      try {
        setThemeLoading(true);
        setThemeError(null);
        const playbook = await getOptimizationCenterPlaybook();
        if (!active) return;
        const options = playbook.themes.map((theme) => ({
          key: theme.key,
          name: theme.name,
        }));
        options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setThemeOptions(options);
      } catch {
        if (!active) return;
        setThemeError('Falha ao carregar temas do playbook.');
      } finally {
        if (active) setThemeLoading(false);
      }
    };

    void loadThemes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSubthemeDrafts((prev) => {
      const next = { ...prev };
      campaigns.forEach((campaign) => {
        if (next[campaign.campaignId] === undefined) {
          next[campaign.campaignId] = campaign.optimizationSubthemeKey ?? '';
        }
      });
      return next;
    });
  }, [campaigns]);

  const setCampaignSaveState = (campaignId: string, next: SaveState) => {
    setSaveState((prev) => ({ ...prev, [campaignId]: next }));
  };

  const handleThemeChange = async (campaignId: string, value: string) => {
    const nextThemeKey = value === AUTO_THEME_VALUE ? null : value;
    setCampaignSaveState(campaignId, { status: 'saving' });

    try {
      if (nextThemeKey === null) {
        await updateCampaign(campaignId, {
          optimizationThemeKey: null,
          optimizationSubthemeKey: null,
        });
        setSubthemeOverrides((prev) => ({ ...prev, [campaignId]: null }));
        setSubthemeDrafts((prev) => ({ ...prev, [campaignId]: '' }));
      } else {
        await updateCampaign(campaignId, { optimizationThemeKey: nextThemeKey });
      }

      setThemeOverrides((prev) => ({ ...prev, [campaignId]: nextThemeKey }));
      setCampaignSaveState(campaignId, { status: 'idle' });
    } catch {
      setCampaignSaveState(campaignId, { status: 'error', message: 'Falha ao salvar tema.' });
    }
  };

  const handleSubthemeSave = async (campaignId: string) => {
    const draft = (subthemeDrafts[campaignId] ?? '').trim();
    const nextSubtheme = draft.length > 0 ? draft : null;
    setCampaignSaveState(campaignId, { status: 'saving' });

    try {
      await updateCampaign(campaignId, { optimizationSubthemeKey: nextSubtheme });
      setSubthemeOverrides((prev) => ({ ...prev, [campaignId]: nextSubtheme }));
      setSubthemeDrafts((prev) => ({ ...prev, [campaignId]: draft }));
      setCampaignSaveState(campaignId, { status: 'idle' });
    } catch {
      setCampaignSaveState(campaignId, { status: 'error', message: 'Falha ao salvar subtema.' });
    }
  };

  const resolveThemeKey = (campaign: PerformanceSummary) =>
    themeOverrides[campaign.campaignId] ?? campaign.optimizationThemeKey ?? null;

  const resolveSubthemeKey = (campaign: PerformanceSummary) =>
    subthemeOverrides[campaign.campaignId] ?? campaign.optimizationSubthemeKey ?? null;

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const scoreA = alertScoreByCampaign[a.campaignId] ?? 0;
    const scoreB = alertScoreByCampaign[b.campaignId] ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const spendA = Number.isFinite(a.totalSpend) ? a.totalSpend : 0;
    const spendB = Number.isFinite(b.totalSpend) ? b.totalSpend : 0;
    if (spendA !== spendB) return spendB - spendA;

    return a.campaignName.localeCompare(b.campaignName, 'pt-BR');
  });

  return {
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
  };
}
