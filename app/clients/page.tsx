'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getClients, deleteClient } from '@/lib/api/client';
import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';

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
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer"
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
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Performance
            </Link>
            <Link
              href={`/optimization/board?clientId=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Kanban className="h-3.5 w-3.5" /> Kanban Board
            </Link>
            <Link
              href={`/optimization/settings?clientId=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Settings2 className="h-3.5 w-3.5" /> Regras
            </Link>
            <Link
              href={`/optimization/effectiveness?clientId=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
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
        <div className="flex flex-wrap gap-2">
          <StatusPill status="healthy" label={`${activeCount} ativos`} />
          <StatusPill status="pending" label={`${clients.length} total`} />
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
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-xs shrink-0" onClick={() => setError(null)}>
                Fechar
              </Button>
            </div>
          </Reveal>
        )}

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
            <EmptyState
              icon={Users}
              title={search ? `Nenhum resultado para "${search}"` : 'Nenhum cliente cadastrado'}
              description={search ? 'Tente um termo diferente.' : 'Adicione o primeiro cliente para começar.'}
              action={search ? { label: 'Limpar busca', onClick: () => setSearch('') } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((client) => (
                <div key={client.id} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-[3px] border-l-primary/50">

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
