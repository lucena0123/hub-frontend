'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClients, deleteClient } from '@/lib/api/client';
import type { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, Plus, Trash2, Pencil, Users, BarChart3, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const tierColors = {
  basic: 'bg-gray-500',
  premium: 'bg-blue-500',
  enterprise: 'bg-purple-500',
  standard: 'bg-slate-500',
};

const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-red-500',
  pending: 'bg-yellow-500',
  suspended: 'bg-orange-500',
  churned: 'bg-zinc-500',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await getClients();
        setClients(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading clients...</p>
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

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      await deleteClient(clientToDelete.id);
      setClients((prev) => prev.filter((client) => client.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Clients
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor all your clients
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Total Clients</p>
            </div>
            <Button asChild>
              <Link href="/clients/new" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Link>
            </Button>
          </div>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Contract Start</TableHead>
                    <TableHead>Contract End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/clients/${client.id}`}
                            className="hover:underline"
                          >
                            {client.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {client.email}
                        </TableCell>
                        <TableCell>
                          <Badge className={tierColors[client.tier] || 'bg-gray-500'}>
                            {client.tier ?? 'standard'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[client.status] || 'bg-gray-500'}>
                            {client.status ?? 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>${client.budget.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(client.contractStart)}</TableCell>
                        <TableCell>{formatDate(client.contractEnd)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button asChild variant="secondary" size="xs">
                              <Link href={`/clients/${client.id}/performance`}>
                                <BarChart3 className="h-3.5 w-3.5" />
                                Performance
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="xs">
                              <Link href={`/clients/${client.id}/reports`}>
                                <FileText className="h-3.5 w-3.5" />
                                Reports
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="xs">
                              <Link href={`/clients/${client.id}?tab=edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => setClientToDelete(client)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Deletar
                            </Button>
                          </div>
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

      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm delete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{clientToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setClientToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
