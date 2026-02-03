import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProcessInstance } from '@/types';
import { format } from 'date-fns';

interface RecentProcessesProps {
  processes: ProcessInstance[];
}

const statusColors = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  paused: 'bg-slate-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  suspended: 'bg-yellow-500',
};

export function RecentProcesses({ processes }: RecentProcessesProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Started At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No processes found
              </TableCell>
            </TableRow>
          ) : (
            processes.map((process) => (
              <TableRow key={process.id}>
                <TableCell className="font-mono text-xs">{process.processId}</TableCell>
                <TableCell>{process.clientName || 'N/A'}</TableCell>
                <TableCell>
                  <Badge className={statusColors[process.status]}>
                    {process.status}
                  </Badge>
                </TableCell>
                <TableCell>{process.priority}</TableCell>
                <TableCell>{process.progress}%</TableCell>
                <TableCell>
                  {format(new Date(process.startedAt), 'MMM dd, HH:mm')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
