'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, ClipboardList, UserCog } from 'lucide-react';
import { getClientById, updateClient } from '@/lib/api/client';
import type { Client } from '@/types';
import { ClientForm, type ClientFormValues } from '@/components/client-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

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

type ClientCampaign = {
  id: string;
  name: string;
  status?: string;
  platform?: string;
  budget?: number;
  spent?: number;
  externalId?: string;
};

type ClientProcess = {
  id: string;
  processId: string;
  status: string;
  priority?: number;
  startedAt?: string;
  completedAt?: string;
  currentPhase?: string | null;
  currentTask?: string | null;
};

type ClientDetails = Client & {
  campaigns?: ClientCampaign[];
  processes?: ClientProcess[];
  _count?: {
    processes?: number;
    campaigns?: number;
    metrics?: number;
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'MMM dd, yyyy');
};

const toDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function ClientDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const defaultTab = useMemo(() => searchParams.get('tab') ?? 'overview', [searchParams]);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        const data = await getClientById(String(clientId));
        setClient(data as ClientDetails);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch client');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleUpdate = async (values: ClientFormValues) => {
    if (!clientId) return;

    try {
      setSaving(true);
      setSaveMessage(null);
      await updateClient(String(clientId), {
        name: values.name,
        email: values.email,
        tier: values.tier,
        budget: values.budget,
        contractStart: values.contractStart,
        contractEnd: values.contractEnd ? values.contractEnd : null,
      });

      const refreshed = await getClientById(String(clientId));
      setClient(refreshed as ClientDetails);
      setSaveMessage('Client updated successfully.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <ClipboardList className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error ?? 'Client not found'}</p>
              <Button asChild className="mt-4">
                <Link href="/clients">Back to clients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const campaigns = client.campaigns ?? [];
  const processes = client.processes ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-7 w-7" />
                {client.name}
              </h1>
              <p className="text-muted-foreground">Client profile and activity overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={tierColors[client.tier] || 'bg-gray-500'}>{client.tier}</Badge>
            <Badge className={statusColors[client.status] || 'bg-gray-500'}>{client.status}</Badge>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="processes">Processes</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Contract</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Start</span>
                    <span>{formatDate(client.contractStart)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">End</span>
                    <span>{formatDate(client.contractEnd)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Budget</span>
                    <span>${client.budget.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CPF/CNPJ</span>
                    <span>{client.cpfCnpj ?? '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Campaigns</span>
                    <span>{client._count?.campaigns ?? campaigns.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Processes</span>
                    <span>{client._count?.processes ?? processes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Metrics</span>
                    <span>{client._count?.metrics ?? '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Associated campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No campaigns found
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.status ?? '-'}</TableCell>
                            <TableCell>{campaign.platform ?? '-'}</TableCell>
                            <TableCell>
                              {campaign.budget ? `$${campaign.budget.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell>
                              {campaign.spent ? `$${campaign.spent.toLocaleString()}` : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes">
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
                      {processes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No processes found
                          </TableCell>
                        </TableRow>
                      ) : (
                        processes.map((process) => (
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
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Update client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {saveMessage && (
                  <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
                    {saveMessage}
                  </div>
                )}
                <ClientForm
                  onSubmit={handleUpdate}
                  submitting={saving}
                  submitLabel="Save changes"
                  defaultValues={{
                    name: client.name,
                    email: client.email,
                    cpfCnpj: client.cpfCnpj ?? '',
                    tier: client.tier ?? 'basic',
                    budget: client.budget,
                    contractStart: toDateInput(client.contractStart),
                    contractEnd: toDateInput(client.contractEnd),
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
