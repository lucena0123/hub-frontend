'use client';

import { useEffect, useState } from 'react';
import { getOptimizationTasks } from '@/lib/api/optimization';
import { Task } from '@/types';
import { TaskActionCard } from '@/components/tasks/task-action-card';
import { Loader2, Activity } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/performance/section-header';
import { Button } from '@/components/ui/button';

export default function OptimizationTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await getOptimizationTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <PageShell
            eyebrow="Intervention"
            title="Central de Ações"
            description="Fila de intervenções automáticas e correções sugeridas."
            meta={
                <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="signal-chip">Pendências {tasks.length}</div>
                    <div className="signal-chip">Priorize agora</div>
                </div>
            }
        >
            <div className="space-y-8">
                <SectionHeader
                    title="Fila de Intervenções"
                    subtitle="Ações sugeridas com impacto direto em performance."
                    icon={Activity}
                    action={(
                        <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading}>
                            Atualizar
                        </Button>
                    )}
                />

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border/50 rounded-lg bg-card/10">
                        <p className="text-muted-foreground tracking-widest uppercase text-sm">Nenhuma intervenção pendente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.map((task) => (
                            <TaskActionCard
                                key={task.id}
                                task={task}
                                onActionComplete={() => {
                                    setTasks(prev => prev.filter(t => t.id !== task.id));
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}
