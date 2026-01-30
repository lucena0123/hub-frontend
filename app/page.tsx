'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentProcesses } from '@/components/dashboard/recent-processes';
import { getDashboardStats, getProcesses } from '@/lib/api/client';
import type { DashboardStats, ProcessInstance } from '@/types';
import {
  Users,
  PlayCircle,
  ListTodo,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [processes, setProcesses] = useState<ProcessInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, processesData] = await Promise.all([
          getDashboardStats(),
          getProcesses(),
        ]);
        setStats(statsData);
        setProcesses(processesData.slice(0, 10)); // Only show recent 10
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure the backend server is running on port 3001
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BPMN System Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your business processes and campaigns
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Clients"
              value={stats.totalClients}
              icon={Users}
              description="All registered clients"
            />
            <StatsCard
              title="Active Clients"
              value={stats.activeClients}
              icon={Activity}
              description="Currently active"
            />
            <StatsCard
              title="Running Processes"
              value={stats.runningProcesses}
              icon={PlayCircle}
              description="In progress"
            />
            <StatsCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              icon={ListTodo}
              description="Awaiting execution"
            />
            <StatsCard
              title="Completed Today"
              value={stats.completedTasksToday}
              icon={CheckCircle2}
              description="Tasks finished today"
            />
          </div>
        )}

        {/* Recent Processes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentProcesses processes={processes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
