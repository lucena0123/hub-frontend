'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClients, deleteClient } from '@/lib/api/client';
import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Plus, Trash2, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';

const tierColors: Record<string, string> = {
  basic: 'bg-muted/20 text-muted-foreground border-border/50',
  premium: 'bg-primary/10 text-primary border-primary/40',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  standard: 'bg-muted/20 text-muted-foreground border-border/50',
};

const statusColors: Record<string, string> = {
  active: 'text-emerald-500',
  inactive: 'text-destructive',
  pending: 'text-yellow-500',
  suspended: 'text-orange-500',
  churned: 'text-muted-foreground',
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
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Falha ao carregar clientes'));
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      await deleteClient(clientToDelete.id);
      setClients((prev) => prev.filter((client) => client.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao excluir cliente'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="edge-card w-full max-w-md p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm uppercase tracking-[0.2em] text-destructive">Falha no sistema</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Agência / Clientes"
      title="Registro de Contas"
      description="Controle o portfólio ativo, contratos e entregas em um mapa único."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {clients.length}</div>
          <div className="signal-chip">Ativos {clients.filter((c) => c.status === 'active').length}</div>
        </div>
      }
      actions={
        <Button asChild>
          <Link href="/clients/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        {error && (
          <Reveal>
            <div className="edge-card border border-destructive/40 bg-destructive/10 p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Aviso</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Reveal>
        )}

        <SectionHeader
          title="Carteira de Clientes"
          subtitle="Acesso rápido às contas ativas e contratos."
          icon={Users}
        />

        <Reveal delayMs={80}>
          {clients.length === 0 ? (
            <div className="edge-card p-12 text-center">
              <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 xl:columns-3 gap-4">
              {clients.map((client, index) => (
                <div key={client.id} className="break-inside-avoid mb-4">
                  <div className={cn(
                    "edge-card hover-lift relative p-5 flex flex-col gap-4",
                    index % 2 === 0 ? "lg:translate-x-3" : "lg:-translate-x-2"
                  )}>
                    <div className="absolute left-0 top-0 h-full w-[2px] bg-primary/40" />

                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className={cn("mb-2 border-0 px-0 text-[10px] tracking-[0.3em] uppercase", statusColors[client.status as string] || 'text-muted-foreground')}>
                          [{client.status || 'UNKNOWN'}]
                        </Badge>
                        <Link href={`/clients/${client.id}`} className="block text-lg font-semibold hover:text-primary transition-colors">
                          {client.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] uppercase border", tierColors[client.tier] || tierColors.standard)}>
                        {client.tier || 'STD'}
                      </Badge>
                    </div>

                    <div className="space-y-2 border-t border-border/30 pt-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span>${client.budget?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Contrato</span>
                        <span className="text-[10px]">{formatDate(client.contractStart)} / {formatDate(client.contractEnd)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                      <Button asChild variant="outline" size="sm" className="h-7 text-[10px] border-border/30 hover:bg-primary/10 hover:text-primary">
                        <Link href={`/clients/${client.id}/performance`}>
                          <BarChart3 className="h-3 w-3 mr-1 opacity-60" /> Perf
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="h-7 text-[10px] border-border/30">
                        <Link href={`/optimization/board?clientId=${client.id}`}>Board</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="h-7 text-[10px] border-border/30">
                        <Link href={`/optimization/settings?clientId=${client.id}`}>Regras</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="h-7 text-[10px] border-border/30">
                        <Link href={`/optimization/effectiveness?clientId=${client.id}`}>Efetividade</Link>
                      </Button>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setClientToDelete(client)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="edge-card w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
            <h3 className="text-lg font-semibold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirmar exclusão
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Cliente: <span className="text-foreground">{clientToDelete.name}</span><br />
              Ação: <span className="text-destructive">remoção definitiva</span>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setClientToDelete(null)} disabled={deleting}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
