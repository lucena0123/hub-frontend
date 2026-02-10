'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOptimizationCenterPlaybook, updateCampaign } from '@/lib/api/client';
import type { PerformanceSummary } from '@/types';

interface CampaignTableProps {
  campaigns: PerformanceSummary[];
}

const statusColors: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-rose-500',
};

const AUTO_THEME_VALUE = '__auto__';

type ThemeOption = {
  key: string;
  name: string;
};

type SaveState = {
  status: 'idle' | 'saving' | 'error';
  message?: string;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

const formatOptionalCurrency = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(1)}%`;
};

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
  const [themeLoading, setThemeLoading] = useState(true);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string | null>>({});
  const [subthemeOverrides, setSubthemeOverrides] = useState<Record<string, string | null>>({});
  const [subthemeDrafts, setSubthemeDrafts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});

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
      } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      setCampaignSaveState(campaignId, { status: 'error', message: 'Falha ao salvar subtema.' });
    }
  };

  const resolveThemeKey = (campaign: PerformanceSummary) =>
    themeOverrides[campaign.campaignId] ?? campaign.optimizationThemeKey ?? null;

  const resolveSubthemeKey = (campaign: PerformanceSummary) =>
    subthemeOverrides[campaign.campaignId] ?? campaign.optimizationSubthemeKey ?? null;

  return (
    <Card className="border-l-4 border-l-sky-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance por Campanha
          <Badge variant="outline">Campanhas</Badge>
        </CardTitle>
        {themeError && (
          <p className="text-xs text-rose-600">{themeError}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Link clicks</TableHead>
                <TableHead className="text-right">LP views</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Conv %</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead className="text-right">Freq.</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Usado</TableHead>
                <TableHead className="text-right">Restante</TableHead>
                <TableHead className="text-right">% uso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={21} className="text-center text-muted-foreground">
                    Nenhuma campanha encontrada
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => {
                  const themeKey = resolveThemeKey(campaign);
                  const subthemeKey = resolveSubthemeKey(campaign);
                  const draftSubtheme = subthemeDrafts[campaign.campaignId] ?? subthemeKey ?? '';
                  const saveInfo = saveState[campaign.campaignId];
                  const isSaving = saveInfo?.status === 'saving';
                  const hasError = saveInfo?.status === 'error';
                  const normalizedSavedSubtheme = (subthemeKey ?? '').trim();
                  const normalizedDraftSubtheme = draftSubtheme.trim();
                  const subthemeDirty = normalizedDraftSubtheme !== normalizedSavedSubtheme;
                  const themeSelectValue = themeKey ?? AUTO_THEME_VALUE;
                  const themeDisabled = themeLoading || themeOptions.length === 0 || isSaving;
                  const conversionRate =
                    campaign.totalClicks > 0 ? (campaign.totalConversions / campaign.totalClicks) * 100 : 0;

                  return (
                    <TableRow key={campaign.campaignId}>
                      <TableCell className="font-medium max-w-[200px] truncate">{campaign.campaignName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.platform}
                        {campaign.budgetMode && campaign.budgetMode !== 'unknown' && (
                          <Badge
                            variant="outline"
                            className={`ml-2 text-[10px] px-1 py-0 h-5 ${campaign.budgetMode === 'abo'
                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                : campaign.budgetMode === 'cbo'
                                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                              }`}
                          >
                            {campaign.budgetMode.toUpperCase()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <Select
                            value={themeSelectValue}
                            onValueChange={(value) => handleThemeChange(campaign.campaignId, value)}
                            disabled={themeDisabled}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Definir tema" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AUTO_THEME_VALUE}>Automático</SelectItem>
                              {themeOptions.map((theme) => (
                                <SelectItem key={theme.key} value={theme.key}>
                                  {theme.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Input
                              value={draftSubtheme}
                              onChange={(e) =>
                                setSubthemeDrafts((prev) => ({
                                  ...prev,
                                  [campaign.campaignId]: e.target.value,
                                }))
                              }
                              placeholder={themeKey ? 'Subtema (opcional)' : 'Selecione um tema'}
                              disabled={!themeKey || isSaving}
                              className="h-8"
                            />
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleSubthemeSave(campaign.campaignId)}
                              disabled={!themeKey || isSaving || !subthemeDirty}
                            >
                              Salvar
                            </Button>
                          </div>
                          {isSaving && (
                            <span className="text-xs text-muted-foreground">Salvando...</span>
                          )}
                          {hasError && (
                            <span className="text-xs text-rose-600">{saveInfo?.message ?? 'Falha ao salvar.'}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(campaign.totalReach || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(campaign.totalImpressions)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.totalClicks)}</TableCell>
                      <TableCell className="text-right">
                        {formatOptionalNumber(campaign.totalLinkClicks)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalNumber(campaign.totalLandingPageViews)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(campaign.totalConversions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(conversionRate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalCurrency(campaign.avgCpc || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(campaign.avgCtr || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalCurrency(campaign.avgCpa || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(campaign.avgCpm || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          (campaign.avgFrequency || 0) >= 5 ? 'text-rose-600 font-medium' :
                            (campaign.avgFrequency || 0) >= 3 ? 'text-yellow-600' : ''
                        }>
                          {(campaign.avgFrequency || 0).toFixed(1)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{campaign.roas.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {formatOptionalCurrency(campaign.budget || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalCurrency(campaign.budgetUsed || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalCurrency(campaign.budgetRemaining || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(campaign.budgetUtilization || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status] ?? 'bg-slate-500'}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
