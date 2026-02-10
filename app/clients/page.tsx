'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClients, deleteClient } from '@/lib/api/client';
import type { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Plus, Trash2, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client/error';

const tierColors: Record<string, string> = {
  basic: 'bg-gray-500/10 text-gray-500 border-gray-500/50',
  premium: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
  enterprise: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/50',
  standard: 'bg-slate-500/10 text-slate-500 border-slate-500/50',
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
          <p className="text-muted-foreground font-mono text-sm tracking-widest">INITIALIZING_CLIENT_DB...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive font-mono">SYSTEM_ERROR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground font-mono">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-mono text-foreground">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {error && (
          <div className="border border-destructive/50 bg-destructive/10 p-4 rounded-sm flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">SYSTEM_WARNING</p>
                <p className="text-sm text-muted-foreground font-mono">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setError(null)}>
              DISMISS
            </Button>
          </div>
        )}
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-primary/20 pb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
            <Activity className="h-32 w-32 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary/50 text-xs tracking-[0.3em] mb-1">
              <Users className="h-3 w-3" />
              <span>TERMINAL_ID: CLIENT_DB</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              CLIENT_REGISTRY
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Active Database Shards: {clients.length}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <Button asChild className="neon-border bg-primary/10 text-primary hover:bg-primary/20">
              <Link href="/clients/new" className="gap-2">
                <Plus className="h-4 w-4" />
                INIT_NEW_CLIENT
              </Link>
            </Button>
          </div>
        </div>

        {/* Client Grid (Replaces Table) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-border/50 rounded-lg">
              <p className="text-muted-foreground text-sm tracking-widest">DATABASE_EMPTY: NO_RECORDS_FOUND</p>
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="group relative border border-border/50 bg-card/30 hover:bg-card/50 transition-all p-5 rounded-sm hover:border-primary/50 flex flex-col gap-4">
                {/* Corner Decorator */}
                <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-primary/30 group-hover:border-primary transition-colors" />

                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className={cn("mb-2 border-0 px-0 rounded-none text-[10px] tracking-widest uppercase", statusColors[client.status as string] || 'text-muted-foreground')}>
                      [{client.status || 'UNKNOWN'}]
                    </Badge>
                    <Link href={`/clients/${client.id}`} className="block text-lg font-bold group-hover:text-primary transition-colors">
                      {client.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{client.email}</span>
                  </div>
                  <Badge variant="outline" className={cn("font-mono text-[10px] uppercase border", tierColors[client.tier] || tierColors.standard)}>
                    {client.tier || 'STD'}
                  </Badge>
                </div>

                <div className="space-y-2 border-t border-border/20 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">BUDGET_ALLOC</span>
                    <span className="font-mono">${client.budget?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">CONTRACT_CYCLE</span>
                    <span className="font-mono text-[10px]">{formatDate(client.contractStart)} / {formatDate(client.contractEnd)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 h-7 text-[10px] border-border/30 hover:bg-primary/10 hover:text-primary group/btn">
                    <Link href={`/clients/${client.id}/performance`}>
                      <BarChart3 className="h-3 w-3 mr-1 opacity-50 group-hover/btn:opacity-100" /> PERF
                    </Link>
                  </Button>
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
            ))
          )}
        </div>

      </div>

      {/* Delete Modal (Kept simple but styled) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-destructive/50 bg-background p-6 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
            <h3 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> CONFIRM_DELETION
            </h3>
            <p className="text-sm text-muted-foreground mb-6 font-mono">
              TARGET: <span className="text-foreground">{clientToDelete.name}</span><br />
              ACTION: <span className="text-destructive">PERMANENT_ERASE</span>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setClientToDelete(null)} disabled={deleting}>CANCEL</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'ERASING...' : 'EXECUTE'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
