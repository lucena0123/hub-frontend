'use client';

import { useEffect, useState } from 'react';
import { getOptimizationTasks } from '@/lib/api/optimization';
import { Task } from '@/types';
import { TaskActionCard } from '@/components/tasks/task-action-card';
import { Loader2, Zap, Activity } from 'lucide-react';

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
        <div className="min-h-screen bg-background p-4 md:p-8 font-mono text-foreground">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header HUD */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-primary/20 pb-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                        <Zap className="h-32 w-32 text-primary" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-primary/50 text-xs tracking-[0.3em] mb-1">
                            <Activity className="h-3 w-3" />
                            <span>TERMINAL_ID: INTERVENTION_OPS</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                            INTERVENTION_CENTER
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                            Pending Actions: {tasks.length}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border/50 rounded-lg bg-card/10">
                        <p className="text-muted-foreground tracking-widest uppercase text-sm">SYSTEM_OPTIMAL: NO_INTERVENTIONS_REQUIRED</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.map((task) => (
                            <div key={task.id} className="neon-border rounded-sm bg-card/30 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
                                </div>
                                <TaskActionCard
                                    task={task}
                                    onActionComplete={() => {
                                        setTasks(prev => prev.filter(t => t.id !== task.id));
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
