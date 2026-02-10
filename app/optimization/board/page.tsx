"use client";

import { useEffect, useState } from "react";
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
import { LayoutDashboard, Users, Loader2 } from "lucide-react";
import { RuleLibrary } from "@/components/optimization/rule-library";

import { ClientSelect } from "@/components/optimization/client-select";

export default function OptimizationBoardPage() {
    const { tasks, columns, mode, fetchTasks, moveTask, setMode, isLoading } = useOptimizationStore();
    const [activeTask, setActiveTask] = useState<OptimizationTask | null>(null);
    const [activeRule, setActiveRule] = useState<OptimizationRule | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);

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

    const handleDragStart = (event: DragStartEvent) => {
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
                moveTask(taskId, newStatus);
            }
            return;
        }

        if (activeType === 'rule') {
            if (!activeRule) return;
            // ... logic
            // For MVP, if dropped on a Column, we assume it's running for that Campaign context.
            // But currently columns are Statuses in Workflow mode.
            // In Campaign mode, columns ARE campaigns.

            if (mode === 'campaign') {
                // In campaign mode, column.id is campaignId.
                const campaignId = over.id as string;
                // We need the client ID. We can get it from the campaign if we had the map, 
                // or use the selectedClientId from store/state if available.
                const store = useOptimizationStore.getState();
                const campaigns = store.campaigns;
                const targetCampaign = campaigns.find(c => c.id === campaignId);

                if (targetCampaign) {
                    // Running rule for a specific campaign context
                    // Rule execution usually needs entityId (which is campaignId here) and clientId.
                    // IMPORTANT: runRule action needs to be implemented/verified.
                    store.runRule(activeRule.id, campaignId, targetCampaign.clientId);
                    alert(`Regra ${activeRule.title ?? activeRule.name ?? activeRule.id} aplicada à campanha ${targetCampaign.name}`);
                }
            } else {
                // ... existing logic for Workflow mode
                if (overData?.type === 'task') {
                    const targetTask = overData.task;
                    const entityId = targetTask.input.entityId;
                    const clientId = targetTask.processInstance?.clientId;
                    if (entityId && clientId) {
                        useOptimizationStore.getState().runRule(activeRule.id, entityId, clientId);
                        alert(`Regra ${activeRule.title ?? activeRule.name ?? activeRule.id} disparada para ${targetTask.input.entityName}`);
                    }
                }
            }
        }
    };

    if (isLoading && tasks.length === 0) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="flex bg-background h-screen overflow-hidden">
            {/* Sidebar */}
            <RuleLibrary />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-primary" />
                        <h1 className="text-xl font-bold">Optimization Board</h1>
                    </div>

                    <div className="flex items-center gap-4">
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
                </header>

                {/* Board Canvas */}
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-muted/10">
                        <div className="flex h-full gap-4 min-w-max">
                            {columns.map(col => (
                                <BoardColumn key={col.id} column={col} tasks={col.tasks} />
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
            </div>
        </div>
    );
}
