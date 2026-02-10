'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ClipboardList } from 'lucide-react';

import { getClientById, updateClient } from '@/lib/api/client';
import type { ClientFormValues } from '@/components/client-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { ClientDetails } from './client-types';
import { ClientCampaignsTable } from './components/client-campaigns';
import { ClientEditForm } from './components/client-edit';
import { ClientHeader } from './components/client-header';
import { ClientOverview } from './components/client-overview';
import { ClientProcessesTable } from './components/client-processes';
import { ClientOptimization } from './components/client-optimization';
import { ClientLeadTracking } from './components/client-lead-tracking';

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

    void fetchClient();
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
        metaAdAccountId: values.metaAdAccountId?.trim() ? values.metaAdAccountId.trim() : undefined,
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
        <ClientHeader client={client} />

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="lead-tracking">Lead Tracking</TabsTrigger>
            <TabsTrigger value="processes">Processes</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClientOverview client={client} campaignsCount={campaigns.length} processesCount={processes.length} />
          </TabsContent>

          <TabsContent value="campaigns">
            <ClientCampaignsTable campaigns={campaigns} />
          </TabsContent>

          <TabsContent value="processes">
            <ClientProcessesTable processes={processes} />
          </TabsContent>

          <TabsContent value="optimization">
            <ClientOptimization clientId={String(clientId)} />
          </TabsContent>

          <TabsContent value="lead-tracking">
            <ClientLeadTracking clientId={String(clientId)} />
          </TabsContent>

          <TabsContent value="edit">
            <ClientEditForm client={client} saving={saving} saveMessage={saveMessage} onSubmit={handleUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

