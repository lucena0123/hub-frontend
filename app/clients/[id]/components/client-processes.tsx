'use client';

import type { ClientProcess } from '../client-types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export const ClientProcessesTable = (props: { processes: ClientProcess[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent processes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Current Phase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No processes found
                  </TableCell>
                </TableRow>
              ) : (
                props.processes.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell className="font-mono text-xs">{process.processId}</TableCell>
                    <TableCell>{process.status}</TableCell>
                    <TableCell>{process.priority ?? '-'}</TableCell>
                    <TableCell>{formatDate(process.startedAt)}</TableCell>
                    <TableCell>{process.currentPhase ?? process.currentTask ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

