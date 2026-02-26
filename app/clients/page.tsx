'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getClients, deleteClient } from '@/lib/api/client';
import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Plus,
  Trash2,
  Users,
  BarChart3,
  AlertTriangle,
  MoreHorizontal,
  Kanban,
  Settings2,
  TrendingUp,
  Search,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonCard } from '@/components/ui/skeleton';

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

function ClientActionsMenu({ client, onDelete }: { client: Client; onDelete: (c: Client) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground cursor-pointer"
        aria-label="Mais ações"
        aria-expanded={open ? 'true' : 'false'}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border/60 bg-card/95 py-1 shadow-2xl backdrop-blur-sm">
            <Link
              href={`/clients/${client.id}/performance`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Performance
            </Link>
            <Link
              href={`/optimization/board?clientId=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Kanban className="h-3.5 w-3.5" /> Kanban Board
            </Link>
            <Link
              href={`/optimization/settings?clientId=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Settings2 className="h-3.5 w-3.5" /> Regras
            </Link>
            <Link
              href={`/optimization/effectiveness?clientId=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Efetividade
            </Link>
            <div className="my-1 border-t border-border/40" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
              onClick={() => { setOpen(false); onDelete(client); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir cliente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

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
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao excluir cliente'));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const activeCount = clients.filter((c) => c.status === 'active').length;

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Clientes' }]}
      title="Registro de Contas"
      description="Controle o portfólio ativo, contratos e entregas em um mapa único."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {clients.length}</div>
          <div className="signal-chip">Ativos {activeCount}</div>
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
      <div className="space-y-6">
        {error && (
          <Reveal>
            <div className="edge-card border border-destructive/40 bg-destructive/10 p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => setError(null)}>
                Fechar
              </Button>
            </div>
          </Reveal>
        )}

        <SectionHeader
          title="Carteira de Clientes"
          subtitle="Acesso rápido às contas ativas e contratos."
          icon={Users}
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            aria-label="Buscar clientes"
          />
        </div>

        {/* Grid */}
        <Reveal delayMs={80}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="edge-card p-12 text-center flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-muted-foreground/20" aria-hidden="true" />
              {search ? (
                <>
                  <p className="text-muted-foreground text-sm">
                    Nenhum cliente encontrado para <strong>"{search}"</strong>
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm tracking-wide">
                    Nenhum cliente cadastrado ainda
                  </p>
                  <Button asChild size="sm">
                    <Link href="/clients/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar primeiro cliente
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((client) => (
                <div key={client.id} className="edge-card hover-lift relative p-5 flex flex-col gap-4">
                  <div className="absolute left-0 top-0 h-full w-[2px] bg-primary/40 rounded-l-sm" />

                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          'mb-2 border-0 px-0 text-[10px] tracking-[0.3em] uppercase',
                          statusColors[client.status as string] || 'text-muted-foreground'
                        )}
                      >
                        [{client.status || 'UNKNOWN'}]
                      </Badge>
                      <Link
                        href={`/clients/${client.id}`}
                        className="block text-base font-semibold hover:text-primary transition-colors truncate cursor-pointer"
                      >
                        {client.name}
                      </Link>
                      <span className="text-xs text-muted-foreground truncate block">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] uppercase border', tierColors[client.tier] || tierColors.standard)}
                      >
                        {client.tier || 'STD'}
                      </Badge>
                      <ClientActionsMenu client={client} onDelete={setClientToDelete} />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/30 pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Budget</span>
                      <span>${client.budget?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Contrato</span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(client.contractStart)} → {formatDate(client.contractEnd)}
                      </span>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="h-8 text-xs mt-auto cursor-pointer">
                    <Link href={`/clients/${client.id}/performance`}>
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                      Ver Performance
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <ConfirmDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        title="Excluir cliente"
        description={
          clientToDelete
            ? `Tem certeza que deseja excluir "${clientToDelete.name}"? Esta ação é irreversível.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </PageShell>
  );
}
