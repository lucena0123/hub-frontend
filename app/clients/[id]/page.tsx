'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ClipboardList, BarChart3, FileText, Bell, ArrowLeft } from 'lucide-react';

import { getClientById, updateClient } from '@/lib/api/client';
import type { ClientFormValues } from '@/components/client-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';

import type { ClientDetails } from './client-types';
import { ClientCampaignsTable } from './components/client-campaigns';
import { ClientEditForm } from './components/client-edit';
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
        businessNicheKey: values.businessNicheKey,
        defaultChannelKey: values.defaultChannelKey,
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

  const tierClass =
    client.tier === 'premium'
      ? 'bg-primary/10 text-primary border-primary/40'
      : client.tier === 'enterprise'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
        : 'bg-muted/20 text-muted-foreground border-border/50';

  const statusClass =
    client.status === 'active'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
      : client.status === 'inactive'
        ? 'bg-destructive/10 text-destructive border-destructive/40'
        : 'bg-muted/20 text-muted-foreground border-border/50';

  return (
    <PageShell
      eyebrow={`Clientes / ${client.id}`}
      title={client.name}
      description="Perfil do cliente com visão de campanhas, processos e otimizações."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={tierClass}>{client.tier ?? 'basic'}</Badge>
            <Badge variant="outline" className={statusClass}>{client.status ?? 'active'}</Badge>
          </div>
          <div className="signal-chip">Budget R$ {client.budget?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) ?? '0'}</div>
          <div className="signal-chip">Campanhas {campaigns.length}</div>
        </div>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/clients" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${client.id}/performance`} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${client.id}/reports`} className="gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <SectionHeader
          title="Seções do Cliente"
          subtitle="Visão geral, campanhas, processos e ajustes."
          icon={ClipboardList}
        />

        <Reveal>
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="premium-subtabs flex-wrap justify-start">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
              <TabsTrigger value="optimization">Otimização</TabsTrigger>
              <TabsTrigger value="lead-tracking">Lead Tracking</TabsTrigger>
              <TabsTrigger value="processes">Processos</TabsTrigger>
              <TabsTrigger value="edit">Editar</TabsTrigger>
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
        </Reveal>
      </div>
    </PageShell>
  );
}
