'use client';

import { useEffect, useState } from 'react';

import type { ClientCampaign } from '../client-types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getOptimizationCenterPlaybook, updateCampaign } from '@/lib/api/client';

const AUTO_THEME_VALUE = '__auto__';

type ThemeOption = {
  key: string;
  name: string;
};

type SaveState = {
  status: 'idle' | 'saving' | 'error';
  message?: string;
};

export const ClientCampaignsTable = (props: { campaigns: ClientCampaign[] }) => {
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
      props.campaigns.forEach((campaign) => {
        if (next[campaign.id] === undefined) {
          next[campaign.id] = campaign.optimizationSubthemeKey ?? '';
        }
      });
      return next;
    });
  }, [props.campaigns]);

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

  const resolveThemeKey = (campaign: ClientCampaign) =>
    themeOverrides[campaign.id] ?? campaign.optimizationThemeKey ?? null;

  const resolveSubthemeKey = (campaign: ClientCampaign) =>
    subthemeOverrides[campaign.id] ?? campaign.optimizationSubthemeKey ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associated campaigns</CardTitle>
        {themeError && <p className="text-xs text-rose-600">{themeError}</p>}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                props.campaigns.map((campaign) => {
                  const themeKey = resolveThemeKey(campaign);
                  const subthemeKey = resolveSubthemeKey(campaign);
                  const draftSubtheme = subthemeDrafts[campaign.id] ?? subthemeKey ?? '';
                  const saveInfo = saveState[campaign.id];
                  const isSaving = saveInfo?.status === 'saving';
                  const hasError = saveInfo?.status === 'error';
                  const normalizedSavedSubtheme = (subthemeKey ?? '').trim();
                  const normalizedDraftSubtheme = draftSubtheme.trim();
                  const subthemeDirty = normalizedDraftSubtheme !== normalizedSavedSubtheme;
                  const themeSelectValue = themeKey ?? AUTO_THEME_VALUE;
                  const themeDisabled = themeLoading || themeOptions.length === 0 || isSaving;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.status ?? '-'}</TableCell>
                      <TableCell>{campaign.platform ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <Select
                            value={themeSelectValue}
                            onValueChange={(value) => handleThemeChange(campaign.id, value)}
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
                                  [campaign.id]: e.target.value,
                                }))
                              }
                              placeholder={themeKey ? 'Subtema (opcional)' : 'Selecione um tema'}
                              disabled={!themeKey || isSaving}
                              className="h-8"
                            />
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleSubthemeSave(campaign.id)}
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
                      <TableCell>{campaign.budget ? `$${campaign.budget.toLocaleString()}` : '-'}</TableCell>
                      <TableCell>{campaign.spent ? `$${campaign.spent.toLocaleString()}` : '-'}</TableCell>
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
};
