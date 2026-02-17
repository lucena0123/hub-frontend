"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOptimizationStore } from "@/lib/stores/optimization-store";
import { PageShell } from "@/components/layout/page-shell";
import { ClientSelect } from "@/components/optimization/client-select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const [clientId, setClientId] = useState<string>("all");
    const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [draftJson, setDraftJson] = useState<string>("{}");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [presetKey, setPresetKey] = useState<ThemePresetKey>("trabalhista");
    const [applyingPreset, setApplyingPreset] = useState(false);

    const canEdit = clientId !== "all";

    useEffect(() => {
        fetchRules(canEdit ? clientId : undefined);
    }, [fetchRules, clientId, canEdit]);

    const sortedRules = useMemo(
        () => [...rules].sort((a, b) => (a.level + a.title).localeCompare(b.level + b.title)),
        [rules]
    );

    const openEditor = (ruleId: string, current: Record<string, unknown> | undefined) => {
        setEditingRuleId(ruleId);
        setDraftJson(JSON.stringify(current ?? {}, null, 2));
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

    return (
        <PageShell
            eyebrow="Intervention"
            title="Configuração de Regras"
            description="Ajuste manual de playbook por cliente, com presets por tema."
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
                    <Button variant="outline" asChild>
                        <Link href="/optimization/board">Voltar ao board</Link>
                    </Button>
                </div>

                {feedback && (
                    <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">{feedback}</div>
                )}

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
