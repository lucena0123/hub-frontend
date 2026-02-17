"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { OptimizationTask, OptimizationRule, OptimizationTaskStatus } from "@/types/optimization";
import { useOptimizationStore } from "@/lib/stores/optimization-store";
import { BoardColumn } from "@/components/optimization/board-column";
import { TaskCard } from "@/components/optimization/task-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, Users, Loader2, ShieldAlert, History } from "lucide-react";
import { RuleLibrary } from "@/components/optimization/rule-library";

import { ClientSelect } from "@/components/optimization/client-select";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/performance/section-header";
import { useAuth } from "@/contexts/auth-context";
import { getOptimizationAudit, getOptimizationAuditSummary, type OptimizationAuditEvent } from "@/lib/api/client/optimization";

const actionLabel: Record<string, string> = {
    create: 'Criação',
    update: 'Atualização',
    delete: 'Remoção',
    read: 'Leitura',
};

const eventTypeLabel = (eventType: string) => {
    if (eventType === 'client.update') return 'Configuração de cliente atualizada';
    if (eventType === 'task.update') return 'Tarefa de otimização atualizada';
    if (eventType.startsWith('task.')) return 'Evento de tarefa';
    if (eventType.startsWith('client.')) return 'Evento de cliente';
    return eventType;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    return null;
};

const extractRoute = (metadata: unknown): string | null => {
    const rec = asRecord(metadata);
    const route = rec?.route;
    return typeof route === 'string' && route.length > 0 ? route : null;
};

const extractEntitySummary = (resource: unknown): string | null => {
    const rec = asRecord(resource);
    const entityType = rec?.entityType;
    const entityId = rec?.entityId;

    if (typeof entityType === 'string' && typeof entityId === 'string') {
        return `${entityType} · ${entityId}`;
    }
    return null;
};

const extractChangeSummary = (changes: unknown): string | null => {
    const rec = asRecord(changes);
    const after = asRecord(rec?.after);
    if (!after) return null;

    const status = after.status;
    const enabled = after.enabled;

    if (typeof status === 'string') return `status: ${status}`;
    if (typeof enabled === 'boolean') return `enabled: ${enabled ? 'true' : 'false'}`;

    return null;
};

export default function OptimizationBoardPage() {
    const { tasks, columns, mode, fetchTasks, moveTask, setMode, isLoading, error } = useOptimizationStore();
    const { user } = useAuth();
    const [activeTask, setActiveTask] = useState<OptimizationTask | null>(null);
    const [activeRule, setActiveRule] = useState<OptimizationRule | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
    const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [auditEvents, setAuditEvents] = useState<OptimizationAuditEvent[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditSummary, setAuditSummary] = useState<Array<{ action: string; total: number }>>([]);
    const [auditEventTypes, setAuditEventTypes] = useState<Array<{ eventType: string; total: number }>>([]);
    const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'read'>('all');
    const [auditEventTypeFilter, setAuditEventTypeFilter] = useState<string>('all');
    const [auditWindowHours, setAuditWindowHours] = useState<6 | 24 | 72>(24);

    const canOperate = useMemo(() => {
        const role = user?.role?.toLowerCase();
        return role === 'admin' || role === 'manager' || role === 'analyst';
    }, [user?.role]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5 // Avoid accidental drags
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        if (!actionFeedback) return;
        const timer = window.setTimeout(() => setActionFeedback(null), 3500);
        return () => window.clearTimeout(timer);
    }, [actionFeedback]);

    const loadAudit = useCallback(async () => {
        try {
            setAuditLoading(true);
            const [events, summary] = await Promise.all([
                getOptimizationAudit({
                    limit: 8,
                    clientId: selectedClientId,
                    action: auditActionFilter === 'all' ? undefined : auditActionFilter,
                    eventType: auditEventTypeFilter === 'all' ? undefined : auditEventTypeFilter,
                    sinceHours: auditWindowHours,
                }),
                getOptimizationAuditSummary({
                    clientId: selectedClientId,
                    sinceHours: auditWindowHours,
                })
            ]);
            setAuditEvents(events);
            setAuditSummary(summary.actions ?? []);
            setAuditEventTypes(summary.eventTypes ?? []);
        } catch {
            setAuditEvents([]);
            setAuditSummary([]);
            setAuditEventTypes([]);
        } finally {
            setAuditLoading(false);
        }
    }, [selectedClientId, auditActionFilter, auditEventTypeFilter, auditWindowHours]);

    useEffect(() => {
        loadAudit();
    }, [loadAudit, tasks.length]);

    const handleDragStart = (event: DragStartEvent) => {
        if (!canOperate) return;

        const { active } = event;
        const type = active.data.current?.type;

        if (type === 'task') {
            const task = tasks.find((t: OptimizationTask) => t.id === active.id);
            if (task) setActiveTask(task);
        } else if (type === 'rule') {
            setActiveRule(active.data.current?.rule);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveTask(null);
        setActiveRule(null);

        if (!over) return;

        if (!canOperate) {
            setActionFeedback({ type: 'error', message: 'Seu perfil não possui permissão para executar ações no board.' });
            return;
        }

        const activeType = active.data.current?.type;
        const overData = over.data.current;

        // Handle Task Move
        if (activeType === 'task') {
            const taskId = active.id as string;
            let newStatus: OptimizationTaskStatus | null = null;

            if (mode === 'workflow') {
                if (overData?.type === 'column' && overData.column.type === 'status') {
                    newStatus = overData.column.id as OptimizationTaskStatus;
                } else if (overData?.type === 'task') {
                    newStatus = overData.task.status as OptimizationTaskStatus;
                }
            }

            if (newStatus && newStatus !== activeTask?.status) {
                try {
                    await moveTask(taskId, newStatus);
                    setActionFeedback({ type: 'success', message: `Tarefa movida para ${newStatus}.` });
                } catch {
                    setActionFeedback({ type: 'error', message: 'Não foi possível mover a tarefa.' });
                }
            }
            return;
        }

        if (activeType === 'rule') {
            if (!activeRule) return;

            try {
                if (mode === 'campaign') {
                    const campaignId = over.id as string;
                    const store = useOptimizationStore.getState();
                    const campaigns = store.campaigns;
                    const targetCampaign = campaigns.find(c => c.id === campaignId);

                    if (targetCampaign) {
                        await store.runRule(activeRule.id, campaignId, targetCampaign.clientId);
                        setActionFeedback({
                            type: 'success',
                            message: `Regra ${activeRule.title ?? activeRule.name ?? activeRule.id} aplicada à campanha ${targetCampaign.name}.`
                        });
                    }
                } else if (overData?.type === 'task') {
                    const targetTask = overData.task;
                    const entityId = targetTask.input.entityId;
                    const clientId = targetTask.processInstance?.clientId;
                    if (entityId && clientId) {
                        await useOptimizationStore.getState().runRule(activeRule.id, entityId, clientId);
                        setActionFeedback({
                            type: 'success',
                            message: `Regra ${activeRule.title ?? activeRule.name ?? activeRule.id} disparada para ${targetTask.input.entityName ?? entityId}.`
                        });
                    }
                }
            } catch {
                setActionFeedback({ type: 'error', message: 'Falha ao executar regra de otimização.' });
            }
        }
    };

    if (isLoading && tasks.length === 0) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <PageShell
            eyebrow="Intervention"
            title="Optimization Board"
            description="Painel tático para priorização de regras e intervenção em campanhas."
        >
            <div className="flex gap-6">
                <RuleLibrary readOnly={!canOperate} />

                <div className="flex-1 space-y-4">
                    {!canOperate && (
                        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Perfil <strong>{user?.role ?? 'viewer'}</strong> com modo leitura. Arrastar tarefas e executar regras exige role admin/manager/analyst.
                        </div>
                    )}

                    {actionFeedback && (
                        <div className={`rounded-md border px-3 py-2 text-xs ${actionFeedback.type === 'success'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                            : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                            {actionFeedback.message}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {error}
                        </div>
                    )}
                    <SectionHeader
                        title="Fluxo de Otimização"
                        subtitle="Arraste tarefas entre colunas ou aplique regras por campanha."
                        icon={LayoutDashboard}
                        action={(
                            <div className="flex flex-wrap items-center gap-3">
                                <ClientSelect
                                    value={selectedClientId}
                                    onChange={(id) => {
                                        const clientId = id === 'all' ? undefined : id;
                                        setSelectedClientId(clientId);
                                        fetchTasks(clientId);
                                    }}
                                />
                                <Select
                                    value={mode}
                                    onValueChange={(value) => {
                                        if (value === 'workflow' || value === 'campaign') {
                                            setMode(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="View Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="workflow">
                                            <div className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Workflow View</div>
                                        </SelectItem>
                                        <SelectItem value="campaign">
                                            <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Campaign View</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => fetchTasks(selectedClientId)} variant="outline" size="sm">
                                    Refresh
                                </Button>
                            </div>
                        )}
                    />

                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="min-h-[520px] overflow-x-auto overflow-y-hidden p-4 bg-muted/10 rounded-[16px] border border-border/60">
                            <div className="flex h-full gap-4 min-w-max">
                                {columns.map(col => (
                                    <BoardColumn key={col.id} column={col} tasks={col.tasks} readOnly={!canOperate} />
                                ))}
                            </div>
                        </div>

                        <DragOverlay>
                            {activeTask ? <TaskCard task={activeTask} /> : null}
                            {activeRule ? (
                                <div className="w-[200px] p-2 bg-background border rounded shadow-lg opacity-80 cursor-grabbing">
                                    {activeRule.title ?? activeRule.name ?? activeRule.id}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    <div className="rounded-[12px] border border-border/60 bg-card/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Últimos eventos de otimização
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={auditActionFilter} onValueChange={(value) => setAuditActionFilter(value as 'all' | 'create' | 'update' | 'delete' | 'read')}>
                                    <SelectTrigger className="h-8 w-[140px]">
                                        <SelectValue placeholder="Ação" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas ações</SelectItem>
                                        <SelectItem value="create">Create</SelectItem>
                                        <SelectItem value="update">Update</SelectItem>
                                        <SelectItem value="delete">Delete</SelectItem>
                                        <SelectItem value="read">Read</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={auditEventTypeFilter} onValueChange={setAuditEventTypeFilter}>
                                    <SelectTrigger className="h-8 w-[190px]">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos tipos</SelectItem>
                                        {auditEventTypes.map((item) => (
                                            <SelectItem key={item.eventType} value={item.eventType}>{item.eventType}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={String(auditWindowHours)} onValueChange={(value) => setAuditWindowHours(Number(value) as 6 | 24 | 72)}>
                                    <SelectTrigger className="h-8 w-[120px]">
                                        <SelectValue placeholder="Janela" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="6">Últimas 6h</SelectItem>
                                        <SelectItem value="24">Últimas 24h</SelectItem>
                                        <SelectItem value="72">Últimas 72h</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={loadAudit} disabled={auditLoading}>
                                    Atualizar log
                                </Button>
                            </div>
                        </div>
                        {auditSummary.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {auditSummary.map((item) => (
                                    <div key={item.action} className="text-[11px] px-2 py-1 rounded bg-secondary/60 text-muted-foreground">
                                        {actionLabel[item.action] ?? item.action}: <span className="text-foreground">{item.total}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {auditLoading ? (
                            <div className="text-xs text-muted-foreground">Carregando auditoria...</div>
                        ) : auditEvents.length === 0 ? (
                            <div className="text-xs text-muted-foreground">Sem eventos recentes para este filtro.</div>
                        ) : (
                            <div className="space-y-2">
                                {auditEvents.map((event) => {
                                    const route = extractRoute(event.metadata);
                                    const entitySummary = extractEntitySummary(event.resource);
                                    const changeSummary = extractChangeSummary(event.changes);

                                    return (
                                        <div key={event.id} className="text-xs border border-border/50 rounded-md px-3 py-2 bg-background/60 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium">{eventTypeLabel(event.eventType)}</div>
                                                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] uppercase tracking-wide">
                                                    {actionLabel[event.action] ?? event.action}
                                                </span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                clientId: {event.clientId} · {new Date(event.timestamp).toLocaleString('pt-BR')}
                                            </div>
                                            {entitySummary && (
                                                <div className="text-[11px] text-muted-foreground/90">entidade: {entitySummary}</div>
                                            )}
                                            {changeSummary && (
                                                <div className="text-[11px] text-muted-foreground/90">mudança: {changeSummary}</div>
                                            )}
                                            {route && (
                                                <div className="text-[11px] text-muted-foreground/80">rota: {route}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
