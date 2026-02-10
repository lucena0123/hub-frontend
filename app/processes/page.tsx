'use client';

import { useEffect, useState } from 'react';
import { getProcesses } from '@/lib/api/client';
import type { ProcessInstance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<ProcessInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoading(true);
        const data = await getProcesses();
        setProcesses(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch processes');
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();

    // Refresh every 15 seconds
    const interval = setInterval(fetchProcesses, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && processes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono text-sm tracking-widest">LOADING_PROCESS_ENGINE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive font-mono">SYSTEM_ERROR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground font-mono">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const runningCount = processes.filter(p => p.status === 'running').length;
  const completedCount = processes.filter(p => p.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-mono text-foreground">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-primary/20 pb-6">
          <div>
            <div className="flex items-center gap-2 text-primary/50 text-xs tracking-[0.3em] mb-1">
              <PlayCircle className="h-3 w-3" />
              <span>TERMINAL_ID: PROCESS_OPS</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              ACTIVE_PROCESSES
            </h1>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col items-end border-r border-border/50 pr-8 last:border-0 last:pr-0">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">RUNNING</span>
              <span className="text-2xl font-bold text-blue-500 shadow-[0_0_10px_var(--color-blue-500)]">{runningCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">COMPLETED</span>
              <span className="text-2xl font-bold text-emerald-500 shadow-[0_0_10px_var(--color-emerald-500)]">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Processes List (Replaces Table) */}
        <div className="space-y-4">
          {processes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border/50 rounded-lg">
              <p className="text-muted-foreground text-sm tracking-widest">NO_ACTIVE_INSTANCES</p>
            </div>
          ) : (
            processes.map((process) => (
              <div key={process.id} className="relative group border border-border/50 bg-card/30 hover:bg-card/50 transition-all p-4 rounded-sm hover:border-primary/50 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase opacity-50">PROCESS_ID</p>
                      <p className="font-mono text-xs">{process.processId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase opacity-50">CLIENT_TARGET</p>
                      <p className="font-bold text-sm truncate">{process.clientName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase opacity-50">STATUS_Core</p>
                      <Badge variant="outline" className={cn(
                        "border-0 bg-transparent px-0 rounded-none",
                        process.status === 'running' ? 'text-blue-500' :
                          process.status === 'completed' ? 'text-emerald-500' :
                            process.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        [{process.status.toUpperCase()}]
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase opacity-50">EXEC_PROGRESS</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">{process.progress}%</span>
                        <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn("h-full", process.status === 'completed' ? 'bg-emerald-500' : 'bg-primary')}
                            style={{ width: `${process.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
