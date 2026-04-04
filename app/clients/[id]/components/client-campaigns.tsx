'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ClientCampaign } from '../client-types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getCampaignRuleContext,
  getOptimizationCenterPlaybook,
  listRuleProfiles,
  updateCampaign,
  updateCampaignRuleContext,
  type CampaignRuleContext,
  type RuleProfileTemplate,
} from '@/lib/api/client';

const AUTO_THEME_VALUE = '__auto__';
const AUTO_PROFILE_VALUE = '__auto_profile__';

const OBJECTIVE_OPTIONS: Array<{ value: 'messages' | 'lead' | 'conversion' | 'traffic' | 'awareness'; label: string }> = [
  { value: 'messages', label: 'Mensagens' },
  { value: 'lead', label: 'Leads' },
  { value: 'conversion', label: 'Conversão' },
  { value: 'traffic', label: 'Tráfego' },
  { value: 'awareness', label: 'Awareness' },
];

const CHANNEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'meta', label: 'Meta Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Outro' },
];

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

  const [ruleContextByCampaign, setRuleContextByCampaign] = useState<Record<string, CampaignRuleContext>>({});
  const [ruleProfiles, setRuleProfiles] = useState<RuleProfileTemplate[]>([]);
  const [ruleContextLoading, setRuleContextLoading] = useState(false);

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
    let active = true;

    const loadRuleData = async () => {
      if (props.campaigns.length === 0) {
        setRuleContextByCampaign({});
        return;
      }

      setRuleContextLoading(true);
      try {
        const [contexts, profiles] = await Promise.all([
          Promise.all(props.campaigns.map((campaign) => getCampaignRuleContext(campaign.id).catch(() => null))),
          listRuleProfiles({ isActive: true }).catch(() => []),
        ]);

        if (!active) return;

        const nextContextMap: Record<string, CampaignRuleContext> = {};
        contexts.forEach((context) => {
          if (context) {
            nextContextMap[context.campaignId] = context;
          }
        });

        setRuleContextByCampaign(nextContextMap);
        setRuleProfiles(profiles);
      } finally {
        if (active) setRuleContextLoading(false);
      }
    };

    void loadRuleData();
    return () => {
      active = false;
    };
  }, [props.campaigns]);

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

  const handleRuleContextUpdate = async (campaignId: string, payload: Parameters<typeof updateCampaignRuleContext>[1]) => {
    setCampaignSaveState(campaignId, { status: 'saving' });
    try {
      const updatedContext = await updateCampaignRuleContext(campaignId, payload);
      setRuleContextByCampaign((prev) => ({
        ...prev,
        [campaignId]: updatedContext,
      }));
      setCampaignSaveState(campaignId, { status: 'idle' });
    } catch {
      setCampaignSaveState(campaignId, { status: 'error', message: 'Falha ao salvar classificação.' });
    }
  };

  const resolveThemeKey = (campaign: ClientCampaign) =>
    themeOverrides[campaign.id] ?? campaign.optimizationThemeKey ?? null;

  const resolveSubthemeKey = (campaign: ClientCampaign) =>
    subthemeOverrides[campaign.id] ?? campaign.optimizationSubthemeKey ?? null;

  const profileById = useMemo(() => {
    const map = new Map<string, RuleProfileTemplate>();
    ruleProfiles.forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  }, [ruleProfiles]);

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
                <TableHead>Classificação</TableHead>
                <TableHead>Perfil efetivo</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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

                  const context = ruleContextByCampaign[campaign.id];
                  const objectiveValue = context?.objectiveClassKey ?? campaign.objectiveClassKey ?? undefined;
                  const channelValue = context?.channelClassKey ?? campaign.channelClassKey ?? undefined;
                  const profileValue = context?.ruleProfileId ?? campaign.ruleProfileId ?? AUTO_PROFILE_VALUE;

                  const matchingProfiles = ruleProfiles.filter((profile) => {
                    const objectiveMatches = objectiveValue ? profile.objectiveKey === objectiveValue : true;
                    const channelMatches = channelValue ? profile.channelKey === channelValue : true;
                    return objectiveMatches && channelMatches;
                  });

                  const resolvedProfileId = context?.resolvedProfile?.profile?.id ?? context?.ruleProfileId ?? null;
                  const resolvedProfileName = resolvedProfileId ? profileById.get(resolvedProfileId)?.name ?? context?.resolvedProfile?.profile?.name ?? null : null;
                  const warnings = context?.resolvedProfile?.warnings ?? [];

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.status ?? '-'}</TableCell>
                      <TableCell>{campaign.platform ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <Select
                            value={objectiveValue}
                            onValueChange={(value) =>
                              void handleRuleContextUpdate(campaign.id, {
                                objectiveClassKey: value as CampaignRuleContext['objectiveClassKey'],
                              })
                            }
                            disabled={isSaving || ruleContextLoading}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {OBJECTIVE_OPTIONS.map((objective) => (
                                <SelectItem key={objective.value} value={objective.value}>
                                  {objective.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={channelValue}
                            onValueChange={(value) =>
                              void handleRuleContextUpdate(campaign.id, {
                                channelClassKey: value,
                              })
                            }
                            disabled={isSaving || ruleContextLoading}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Canal" />
                            </SelectTrigger>
                            <SelectContent>
                              {CHANNEL_OPTIONS.map((channel) => (
                                <SelectItem key={channel.value} value={channel.value}>
                                  {channel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 min-w-[260px]">
                          <Select
                            value={profileValue}
                            onValueChange={(value) =>
                              void handleRuleContextUpdate(campaign.id, {
                                ruleProfileId: value === AUTO_PROFILE_VALUE ? null : value,
                              })
                            }
                            disabled={isSaving || ruleContextLoading}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Resolver automaticamente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AUTO_PROFILE_VALUE}>Automático</SelectItem>
                              {matchingProfiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            {resolvedProfileName ? `Perfil: ${resolvedProfileName}` : 'Sem perfil resolvido'}
                          </div>
                          {warnings.length > 0 ? (
                            <div className="text-xs text-amber-700">Avisos: {warnings.join(', ')}</div>
                          ) : null}
                        </div>
                      </TableCell>
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
