'use client';

import { useEffect, useState } from 'react';
import { getProcesses } from '@/lib/api/client';
import type { ProcessInstance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  paused: 'bg-slate-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  suspended: 'bg-yellow-500',
};

const priorityColors = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

function getPriorityLabel(priority: number): string {
  if (priority >= 9) return 'Critical';
  if (priority >= 7) return 'High';
  if (priority >= 4) return 'Medium';
  return 'Low';
}

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading processes...</p>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const runningCount = processes.filter(p => p.status === 'running').length;
  const completedCount = processes.filter(p => p.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <PlayCircle className="h-8 w-8" />
              Process Instances
            </h1>
            <p className="text-muted-foreground">
              Monitor all running and completed processes
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <p className="text-2xl font-bold text-blue-600">{runningCount}</p>
              <p className="text-sm text-muted-foreground">Running</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        {/* Processes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No processes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    processes.map((process) => (
                      <TableRow key={process.id}>
                        <TableCell className="font-mono text-xs">
                          {process.processId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {process.clientName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[process.status]}>
                            {process.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const priorityValue = process.priority ?? 5;
                            const priorityLabel = getPriorityLabel(priorityValue);
                            return (
                              <span
                                className={
                                  priorityColors[
                                    priorityLabel.toLowerCase() as keyof typeof priorityColors
                                  ]
                                }
                              >
                                {priorityLabel}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${process.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {process.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {process.currentStep || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(process.startedAt), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {process.completedAt
                            ? format(new Date(process.completedAt), 'MMM dd, HH:mm')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
