'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOptimizationTasks } from '@/lib/api/optimization';
import { Task } from '@/types';
import { TaskActionCard } from '@/components/tasks/task-action-card';
import { Loader2, Activity } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/performance/section-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OptimizationTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientFilter, setClientFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [query, setQuery] = useState('');

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

    const clientOptions = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.clientName).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [tasks]
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (clientFilter !== 'all' && task.clientName !== clientFilter) return false;
            if (severityFilter !== 'all' && (task.input?.severity ?? 'medium') !== severityFilter) return false;
            if (query.trim()) {
                const q = query.trim().toLowerCase();
                const hay = `${task.name} ${task.input?.description ?? ''} ${task.clientName ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [tasks, clientFilter, severityFilter, query]);

    return (
        <PageShell
            eyebrow="Intervention"
            title="Central de Ações"
            description="Fila de intervenções automáticas e correções sugeridas."
            meta={
                <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="signal-chip">Pendências {filteredTasks.length}</div>
                    <div className="signal-chip">Total {tasks.length}</div>
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

                <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 flex flex-wrap items-center gap-2">
                    <Input
                        placeholder="Buscar por nome, descrição ou cliente"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-8 w-full sm:w-[260px]"
                    />
                    <select
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                        <option value="all">Todos os clientes</option>
                        {clientOptions.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                        <option value="all">Todas severidades</option>
                        <option value="critical">critical</option>
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border/50 rounded-lg bg-card/10">
                        <p className="text-muted-foreground tracking-widest uppercase text-sm">Nenhuma intervenção para o filtro atual.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map((task) => (
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
