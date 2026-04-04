"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOptimizationStore } from "@/lib/stores/optimization-store";
import { PageShell } from "@/components/layout/page-shell";
import { ClientSelect } from "@/components/optimization/client-select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    listRuleProfiles,
    listRuleReviewQueue,
    resolveRuleReviewItem,
    runRuleBackfill,
    updateRuleProfile,
    type RuleClassificationReview,
    type RuleProfileTemplate,
} from "@/lib/api/client";

type ThemePresetKey = "trabalhista" | "salario_maternidade" | "passageiro_aereo";

const PRESETS: Record<ThemePresetKey, Record<string, Record<string, unknown>>> = {
    trabalhista: {
        "campaign.no-contacts": { minSpend: 35, windowDays: 2 },
        "campaign.cpl-high": { cplThreshold: 18, windowDays: 3 },
        "campaign.frequency-high": { frequencyThreshold: 2.2, windowDays: 3 },
        "campaign.first-reply-low": { firstReplyRateMin: 0.45, minConversations: 8 },
        "adset.no-contacts": { minSpend: 25, windowDays: 2 },
        "qualification.zero": { minLeads: 8, windowDays: 3 },
        "creative.fatigued": { frequencyThreshold: 2.4, windowDays: 5 },
        "creative.loser": { minSpend: 20, cplMultiplier: 1.35, windowDays: 3 },
    },
    salario_maternidade: {
        "campaign.no-contacts": { minSpend: 30, windowDays: 2 },
        "campaign.cpl-high": { cplThreshold: 16, windowDays: 3 },
        "campaign.frequency-high": { frequencyThreshold: 2.0, windowDays: 3 },
        "campaign.first-reply-low": { firstReplyRateMin: 0.48, minConversations: 8 },
        "adset.no-contacts": { minSpend: 22, windowDays: 2 },
        "qualification.zero": { minLeads: 7, windowDays: 3 },
        "creative.fatigued": { frequencyThreshold: 2.3, windowDays: 5 },
        "creative.loser": { minSpend: 18, cplMultiplier: 1.3, windowDays: 3 },
    },
    passageiro_aereo: {
        "campaign.no-contacts": { minSpend: 28, windowDays: 2 },
        "campaign.cpl-high": { cplThreshold: 14, windowDays: 3 },
        "campaign.frequency-high": { frequencyThreshold: 1.9, windowDays: 3 },
        "campaign.first-reply-low": { firstReplyRateMin: 0.5, minConversations: 8 },
        "adset.no-contacts": { minSpend: 20, windowDays: 2 },
        "qualification.zero": { minLeads: 6, windowDays: 3 },
        "creative.fatigued": { frequencyThreshold: 2.2, windowDays: 5 },
        "creative.loser": { minSpend: 16, cplMultiplier: 1.25, windowDays: 3 },
    },
};

export default function OptimizationSettingsPage() {
    const { rules, fetchRules, toggleRule, updateRuleConfig } = useOptimizationStore();
    const searchParams = useSearchParams();
    const [clientId, setClientId] = useState<string>("all");
    const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [draftJson, setDraftJson] = useState<string>("{}");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [presetKey, setPresetKey] = useState<ThemePresetKey>("trabalhista");
    const [applyingPreset, setApplyingPreset] = useState(false);

    const [profiles, setProfiles] = useState<RuleProfileTemplate[]>([]);
    const [profilesLoading, setProfilesLoading] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<RuleProfileTemplate | null>(null);
    const [targetsJson, setTargetsJson] = useState<string>("{}");
    const [copyPolicyJson, setCopyPolicyJson] = useState<string>("{}");
    const [profileSaving, setProfileSaving] = useState(false);

    const [reviewQueue, setReviewQueue] = useState<RuleClassificationReview[]>([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [backfilling, setBackfilling] = useState(false);

    const canEdit = clientId !== "all";

    const loadProfileData = async () => {
        setProfilesLoading(true);
        setReviewLoading(true);
        try {
            const [profileRows, reviewRows] = await Promise.all([
                listRuleProfiles().catch(() => []),
                listRuleReviewQueue({ status: "pending", limit: 50 }).catch(() => []),
            ]);
            setProfiles(profileRows);
            setReviewQueue(reviewRows);
        } finally {
            setProfilesLoading(false);
            setReviewLoading(false);
        }
    };

    useEffect(() => {
        const queryClientId = searchParams.get("clientId");
        if (queryClientId) setClientId(queryClientId);
    }, [searchParams]);

    useEffect(() => {
        fetchRules(canEdit ? clientId : undefined);
    }, [fetchRules, clientId, canEdit]);

    useEffect(() => {
        void loadProfileData();
    }, []);

    const sortedRules = useMemo(
        () => [...rules].sort((a, b) => (a.level + a.title).localeCompare(b.level + b.title)),
        [rules]
    );

    const sortedProfiles = useMemo(
        () => [...profiles].sort((a, b) => `${a.nicheKey}-${a.objectiveKey}-${a.channelKey}`.localeCompare(`${b.nicheKey}-${b.objectiveKey}-${b.channelKey}`)),
        [profiles]
    );

    const openEditor = (ruleId: string, current: Record<string, unknown> | undefined) => {
        setEditingRuleId(ruleId);
        setDraftJson(JSON.stringify(current ?? {}, null, 2));
    };

    const openProfileEditor = (profile: RuleProfileTemplate) => {
        setSelectedProfile(profile);
        setTargetsJson(JSON.stringify(profile.targets ?? {}, null, 2));
        setCopyPolicyJson(JSON.stringify(profile.copyPolicy ?? {}, null, 2));
    };

    const saveParams = async (ruleId: string) => {
        if (!canEdit) return;
        try {
            const parsed = JSON.parse(draftJson) as Record<string, unknown>;
            setSavingRuleId(ruleId);
            await updateRuleConfig(ruleId, parsed, clientId);
            setFeedback(`Parâmetros salvos para ${ruleId}.`);
            setEditingRuleId(null);
        } catch {
            setFeedback("JSON inválido ou erro ao salvar parâmetros.");
        } finally {
            setSavingRuleId(null);
        }
    };

    const applyPreset = async () => {
        if (!canEdit) return;
        const preset = PRESETS[presetKey];
        setApplyingPreset(true);
        setFeedback(null);
        try {
            for (const [ruleId, params] of Object.entries(preset)) {
                await updateRuleConfig(ruleId, params, clientId);
            }
            await fetchRules(clientId);
            setFeedback(`Preset ${presetKey} aplicado com sucesso para o cliente.`);
        } catch {
            setFeedback("Falha ao aplicar preset por tema.");
        } finally {
            setApplyingPreset(false);
        }
    };

    const saveSelectedProfile = async () => {
        if (!selectedProfile) return;
        try {
            setProfileSaving(true);
            const nextTargets = JSON.parse(targetsJson) as Record<string, unknown>;
            const nextCopyPolicy = JSON.parse(copyPolicyJson) as Record<string, unknown>;
            await updateRuleProfile(selectedProfile.id, {
                targets: nextTargets,
                copyPolicy: nextCopyPolicy,
            });
            setFeedback(`Perfil ${selectedProfile.name} atualizado.`);
            await loadProfileData();
        } catch {
            setFeedback("Falha ao salvar profile (JSON inválido ou erro de API).");
        } finally {
            setProfileSaving(false);
        }
    };

    const toggleProfileActive = async (profile: RuleProfileTemplate, isActive: boolean) => {
        try {
            await updateRuleProfile(profile.id, { isActive });
            setFeedback(`Perfil ${profile.name} ${isActive ? "ativado" : "desativado"}.`);
            await loadProfileData();
        } catch {
            setFeedback("Falha ao atualizar status do profile.");
        }
    };

    const executeBackfill = async () => {
        try {
            setBackfilling(true);
            const result = await runRuleBackfill();
            setFeedback(`Backfill concluído: clientes ${result.clientsUpdated}, campanhas ${result.campaignsUpdated}, revisão ${result.reviewItems}.`);
            await loadProfileData();
        } catch {
            setFeedback("Falha ao executar backfill.");
        } finally {
            setBackfilling(false);
        }
    };

    const resolveReview = async (id: string, status: "approved" | "rejected", selectedProfileId?: string | null) => {
        try {
            await resolveRuleReviewItem(id, {
                status,
                selectedProfileId,
                applyToEntity: true,
            });
            setFeedback(`Item ${id} ${status === "approved" ? "aprovado" : "rejeitado"}.`);
            await loadProfileData();
        } catch {
            setFeedback("Falha ao resolver item da fila de revisão.");
        }
    };

    return (
        <PageShell
            eyebrow="Intervention"
            title="Configuração de Regras"
            description="Ajuste de playbook por cliente e gestão de profiles compostos."
        >
            <div className="space-y-4">
                <div className="rounded-[12px] border border-border/60 bg-card/40 p-4 flex flex-wrap items-center gap-3">
                    <ClientSelect value={clientId} onChange={setClientId} />
                    <Select value={presetKey} onValueChange={(v) => setPresetKey(v as ThemePresetKey)}>
                        <SelectTrigger className="w-[220px]"><SelectValue placeholder="Preset por tema" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="trabalhista">Preset: Trabalhista</SelectItem>
                            <SelectItem value="salario_maternidade">Preset: Salário Maternidade</SelectItem>
                            <SelectItem value="passageiro_aereo">Preset: Passageiro Aéreo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={applyPreset} disabled={!canEdit || applyingPreset}>
                        Aplicar preset por tema
                    </Button>
                    <Button variant="outline" onClick={executeBackfill} disabled={backfilling}>
                        {backfilling ? "Executando backfill..." : "Rodar backfill"}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/optimization/board">Voltar ao board</Link>
                    </Button>
                </div>

                {feedback && (
                    <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">{feedback}</div>
                )}

                <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Optimization Profiles</h3>
                        <Badge variant="secondary">{profilesLoading ? "Carregando..." : `${profiles.length} perfis`}</Badge>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                            {sortedProfiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className={`rounded-md border px-3 py-2 text-xs ${selectedProfile?.id === profile.id ? "border-primary/60 bg-primary/5" : "border-border/60"}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <button className="text-left" onClick={() => openProfileEditor(profile)}>
                                            <div className="font-medium text-sm">{profile.name}</div>
                                            <div className="text-muted-foreground">
                                                {profile.nicheKey} · {profile.objectiveKey} · {profile.channelKey} · v{profile.version}
                                            </div>
                                        </button>
                                        <Switch checked={profile.isActive} onCheckedChange={(next) => void toggleProfileActive(profile, next)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {selectedProfile ? (
                                <>
                                    <div className="text-xs text-muted-foreground">Targets JSON ({selectedProfile.name})</div>
                                    <Textarea className="font-mono text-xs min-h-[140px]" value={targetsJson} onChange={(e) => setTargetsJson(e.target.value)} />
                                    <div className="text-xs text-muted-foreground">Copy policy JSON</div>
                                    <Textarea className="font-mono text-xs min-h-[140px]" value={copyPolicyJson} onChange={(e) => setCopyPolicyJson(e.target.value)} />
                                    <Button size="sm" onClick={saveSelectedProfile} disabled={profileSaving}>
                                        {profileSaving ? "Salvando..." : "Salvar profile"}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-xs text-muted-foreground">Selecione um profile para editar targets e copy policy.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Fila de Revisão</h3>
                        <Badge variant="secondary">{reviewLoading ? "Carregando..." : `${reviewQueue.length} pendentes`}</Badge>
                    </div>

                    {reviewQueue.length === 0 ? (
                        <div className="text-xs text-muted-foreground">Sem itens pendentes.</div>
                    ) : (
                        <div className="space-y-2">
                            {reviewQueue.map((item) => (
                                <div key={item.id} className="rounded-md border border-border/60 p-2 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium">{item.entityType} · {item.entityId}</div>
                                            <div className="text-muted-foreground">{item.reasonCode}</div>
                                            {item.suggestedProfile?.name ? (
                                                <div className="text-muted-foreground">Sugestão: {item.suggestedProfile.name}</div>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => void resolveReview(item.id, "rejected")}>Rejeitar</Button>
                                            <Button size="sm" onClick={() => void resolveReview(item.id, "approved", item.suggestedProfileId ?? undefined)}>Aprovar</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid gap-3">
                    {sortedRules.map((rule) => (
                        <div key={rule.id} className="rounded-[12px] border border-border/60 bg-card/40 p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="text-sm font-medium">{rule.title ?? rule.id}</div>
                                    <div className="text-xs text-muted-foreground">{rule.id}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{rule.level}</Badge>
                                    <Badge variant="secondary">{rule.severity}</Badge>
                                    <Badge variant="secondary">{rule.action}</Badge>
                                    <Switch
                                        checked={rule.enabled ?? true}
                                        disabled={!canEdit || savingRuleId === rule.id}
                                        onCheckedChange={async (enabled) => {
                                            if (!canEdit) return;
                                            setSavingRuleId(rule.id);
                                            try {
                                                await toggleRule(rule.id, enabled, clientId);
                                                setFeedback(`Regra ${rule.id} ${enabled ? "ativada" : "desativada"}.`);
                                            } finally {
                                                setSavingRuleId(null);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground">{rule.description}</div>

                            {editingRuleId === rule.id ? (
                                <div className="space-y-2">
                                    <Textarea value={draftJson} onChange={(e) => setDraftJson(e.target.value)} className="font-mono text-xs min-h-[140px]" />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveParams(rule.id)} disabled={!canEdit || savingRuleId === rule.id}>Salvar parâmetros</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingRuleId(null)}>Cancelar</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <pre className="text-[11px] text-muted-foreground max-w-[75%] truncate">{JSON.stringify(rule.parameters ?? {})}</pre>
                                    <Button size="sm" variant="outline" onClick={() => openEditor(rule.id, rule.parameters)} disabled={!canEdit}>Editar parâmetros</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </PageShell>
    );
}
