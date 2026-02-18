'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BarChart3, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

import { apiClient } from '@/lib/api/client/http';
import { getAlerts } from '@/lib/api/client';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/performance/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ExecutiveClient = {
  clientId: string;
  clientName: string;
  healthScore: number | null;
  healthGrade: string | null;
  anomalyCount: number;
  conversations7d: number;
  cpl7d: number | null;
};

type ExecutiveResponse = {
  kpi: {
    totalClients: number;
    totalAnomalies: number;
    totalConversations7d: number;
    totalSpend7d: number;
  };
  clients: ExecutiveClient[];
};

type CampaignHealthItem = {
  campaignId: string;
  campaignName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
};

type ClientCampaignHealth = {
  clientId: string;
  campaigns: CampaignHealthItem[];
};

const resolveState = (score: number | null) => {
  if (score == null) return { label: 'Sem dado', className: 'bg-muted text-muted-foreground' };
  if (score >= 75) return { label: 'Saudável', className: 'bg-emerald-500/15 text-emerald-300' };
  if (score >= 50) return { label: 'Atenção', className: 'bg-amber-500/15 text-amber-300' };
  return { label: 'Crítico', className: 'bg-destructive/15 text-destructive' };
};

export default function SummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executive, setExecutive] = useState<ExecutiveResponse | null>(null);
  const [alerts, setAlerts] = useState<{ total: number; critical: number; warning: number } | null>(null);
  const [campaignHealthMap, setCampaignHealthMap] = useState<Record<string, CampaignHealthItem[]>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [execRes, alertsRes] = await Promise.all([
          apiClient.get<ExecutiveResponse>('/api/dashboard/executive'),
          getAlerts(),
        ]);

        const execData = execRes.data;
        setExecutive(execData);
        setAlerts({ total: alertsRes.total, critical: alertsRes.critical, warning: alertsRes.warning });

        const healthResponses = await Promise.all(
          execData.clients.map(async (client) => {
            const { data } = await apiClient.get<ClientCampaignHealth>(`/api/clients/${client.clientId}/campaign-health`);
            return { clientId: client.clientId, campaigns: data.campaigns ?? [] };
          })
        );

        const next: Record<string, CampaignHealthItem[]> = {};
        healthResponses.forEach((item) => {
          next[item.clientId] = item.campaigns;
        });
        setCampaignHealthMap(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar resumo de saúde');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const criticalCampaigns = useMemo(() => {
    const rows: Array<{ clientId: string; clientName: string; campaign: CampaignHealthItem }> = [];
    if (!executive) return rows;

    executive.clients.forEach((client) => {
      (campaignHealthMap[client.clientId] ?? []).forEach((campaign) => {
        if (campaign.score < 50) rows.push({ clientId: client.clientId, clientName: client.clientName, campaign });
      });
    });

    return rows.sort((a, b) => a.campaign.score - b.campaign.score);
  }, [campaignHealthMap, executive]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !executive) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-destructive">{error ?? 'Falha ao carregar resumo'}</div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Operação / Resumo"
      title="Resumo de Saúde"
      description="Visão única para saber se as campanhas estão saudáveis, em atenção ou críticas."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/performance">Abrir Performance</Link>
        </Button>
      }
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Clientes {executive.kpi.totalClients}</div>
          <div className="signal-chip">Alertas {alerts?.total ?? 0}</div>
          <div className="signal-chip">Críticos {criticalCampaigns.length}</div>
        </div>
      }
    >
      <div className="space-y-8">
        <SectionHeader title="Painel Consolidado" subtitle="Saúde por cliente e campanhas críticas." icon={BarChart3} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Conversas (7d)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{executive.kpi.totalConversations7d}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Spend (7d)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">R$ {executive.kpi.totalSpend7d.toFixed(2)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Alertas</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>Total: {alerts?.total ?? 0}</div>
              <div>Warnings: {alerts?.warning ?? 0}</div>
              <div>Críticos: {alerts?.critical ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <SectionHeader title="Saúde por Cliente" subtitle="Estado geral e acesso rápido para ação." icon={CheckCircle2} />
        <div className="space-y-3">
          {executive.clients.map((client) => {
            const state = resolveState(client.healthScore);
            const campaigns = campaignHealthMap[client.clientId] ?? [];
            const criticalCount = campaigns.filter((c) => c.score < 50).length;

            return (
              <Card key={client.clientId}>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{client.clientName}</div>
                      <div className="text-xs text-muted-foreground">
                        score {client.healthScore ?? '-'} · grade {client.healthGrade ?? '-'} · conv 7d {client.conversations7d}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={state.className}>{state.label}</Badge>
                      {criticalCount > 0 && (
                        <Badge className="bg-destructive/15 text-destructive">{criticalCount} campanha(s) crítica(s)</Badge>
                      )}
                      <Button asChild size="sm" variant="outline"><Link href={`/clients/${client.clientId}/performance`}>Abrir</Link></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <SectionHeader title="Campanhas Críticas" subtitle="Prioridade de ação imediata." icon={ShieldAlert} />
        {criticalCampaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-emerald-300">Nenhuma campanha crítica no momento.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {criticalCampaigns.map(({ clientId, clientName, campaign }) => (
              <Card key={`${clientId}-${campaign.campaignId}`}>
                <CardContent className="pt-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{campaign.campaignName}</div>
                    <div className="text-xs text-muted-foreground">{clientName} · score {campaign.score} · grade {campaign.grade}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-destructive/15 text-destructive">Crítico</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/optimization/settings?clientId=${clientId}`}>Ajustar regras</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Esse resumo consolida dados de executivo, alertas e campaign-health em uma única tela.
        </div>
      </div>
    </PageShell>
  );
}
