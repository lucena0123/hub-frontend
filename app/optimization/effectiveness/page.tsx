"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ClientSelect } from "@/components/optimization/client-select";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOptimizationAudit, getOptimizationAuditSummary, type OptimizationAuditEvent } from "@/lib/api/client/optimization";
import { BarChart3, RefreshCw } from "lucide-react";

type WindowHours = 6 | 24 | 72;

type RuleMetric = {
    key: string;
    total: number;
    updates: number;
    reads: number;
    creates: number;
    deletes: number;
    lastAt: string;
};

const normalizeRuleKey = (event: OptimizationAuditEvent): string => {
    const resource = event.resource as Record<string, unknown> | null;
    const ruleId = resource?.ruleId;
    if (typeof ruleId === "string" && ruleId.trim()) return ruleId;
    if (event.eventType.startsWith("task.")) return "task.flow";
    if (event.eventType.startsWith("client.")) return "client.config";
    return event.eventType;
};

const statusFromMetric = (metric: RuleMetric): "útil" | "ruidosa" | "inativa" => {
    if (metric.total === 0) return "inativa";
    if (metric.updates >= Math.max(2, Math.floor(metric.total * 0.4))) return "útil";
    if (metric.reads > metric.updates && metric.total >= 3) return "ruidosa";
    return "útil";
};

export default function OptimizationEffectivenessPage() {
    const [clientId, setClientId] = useState<string>("all");
    const [windowHours, setWindowHours] = useState<WindowHours>(24);
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<OptimizationAuditEvent[]>([]);
    const [summary, setSummary] = useState<{ total: number; updates: number }>({ total: 0, updates: 0 });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const cid = clientId === "all" ? undefined : clientId;
            const [auditEvents, auditSummary] = await Promise.all([
                getOptimizationAudit({ clientId: cid, sinceHours: windowHours, limit: 200 }),
                getOptimizationAuditSummary({ clientId: cid, sinceHours: windowHours }),
            ]);

            const updates = (auditSummary.actions ?? []).find((a) => a.action === "update")?.total ?? 0;
            const total = (auditSummary.actions ?? []).reduce((acc, item) => acc + item.total, 0);

            setEvents(auditEvents);
            setSummary({ total, updates });
        } finally {
            setLoading(false);
        }
    }, [clientId, windowHours]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const metrics = useMemo(() => {
        const map = new Map<string, RuleMetric>();

        for (const event of events) {
            const key = normalizeRuleKey(event);
            const current = map.get(key) ?? {
                key,
                total: 0,
                updates: 0,
                reads: 0,
                creates: 0,
                deletes: 0,
                lastAt: event.timestamp,
            };

            current.total += 1;
            if (event.action === "update") current.updates += 1;
            if (event.action === "read") current.reads += 1;
            if (event.action === "create") current.creates += 1;
            if (event.action === "delete") current.deletes += 1;
            if (new Date(event.timestamp) > new Date(current.lastAt)) current.lastAt = event.timestamp;

            map.set(key, current);
        }

        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [events]);

    return (
        <PageShell
            eyebrow="Intervention"
            title="Efetividade das Regras"
            description="Painel rápido para decidir manter, ajustar ou desligar regras com base em auditoria."
        >
            <div className="space-y-4">
                <div className="rounded-[12px] border border-border/60 bg-card/40 p-4 flex flex-wrap items-center gap-3">
                    <ClientSelect value={clientId} onChange={setClientId} />
                    <Select value={String(windowHours)} onValueChange={(v) => setWindowHours(Number(v) as WindowHours)}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Janela" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">Últimas 6h</SelectItem>
                            <SelectItem value="24">Últimas 24h</SelectItem>
                            <SelectItem value="72">Últimas 72h</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/optimization/board">Voltar ao board</Link>
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[12px] border border-border/60 bg-card/40 p-4">
                        <div className="text-xs text-muted-foreground">Eventos totais</div>
                        <div className="text-2xl font-semibold mt-1">{summary.total}</div>
                    </div>
                    <div className="rounded-[12px] border border-border/60 bg-card/40 p-4">
                        <div className="text-xs text-muted-foreground">Atualizações</div>
                        <div className="text-2xl font-semibold mt-1">{summary.updates}</div>
                    </div>
                    <div className="rounded-[12px] border border-border/60 bg-card/40 p-4">
                        <div className="text-xs text-muted-foreground">Sinais únicos</div>
                        <div className="text-2xl font-semibold mt-1">{metrics.length}</div>
                    </div>
                </div>

                <div className="rounded-[12px] border border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <BarChart3 className="w-4 h-4" />
                        Leitura por regra/sinal
                    </div>

                    {loading ? (
                        <div className="text-xs text-muted-foreground">Carregando...</div>
                    ) : metrics.length === 0 ? (
                        <div className="text-xs text-muted-foreground">Sem eventos na janela selecionada.</div>
                    ) : (
                        <div className="space-y-2">
                            {metrics.map((m) => {
                                const status = statusFromMetric(m);
                                return (
                                    <div key={m.key} className="rounded-md border border-border/50 bg-background/60 px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-xs font-medium truncate">{m.key}</div>
                                            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
                                                status === "útil"
                                                    ? "bg-emerald-500/15 text-emerald-300"
                                                    : status === "ruidosa"
                                                        ? "bg-amber-500/15 text-amber-300"
                                                        : "bg-muted text-muted-foreground"
                                            }`}>{status}</span>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-1">
                                            total: {m.total} · updates: {m.updates} · reads: {m.reads} · last: {new Date(m.lastAt).toLocaleString("pt-BR")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
