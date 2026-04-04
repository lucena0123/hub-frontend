'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { FolderKanban, Milestone, Plus, RefreshCw } from 'lucide-react';

import { createProject, getClients, listProjects, type Project } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client } from '@/types';
import { formatDate } from '@/lib/utils';

const statusClass: Record<Project['status'], string> = {
  planned: 'bg-blue-500/15 text-blue-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  blocked: 'bg-destructive/15 text-destructive',
  done: 'bg-primary/15 text-primary',
  cancelled: 'bg-muted text-muted-foreground',
};

const statusLabel: Record<Project['status'], string> = {
  planned: 'Planejado',
  active: 'Ativo',
  blocked: 'Bloqueado',
  done: 'Concluído',
  cancelled: 'Cancelado',
};

const initialForm = {
  clientId: '',
  name: '',
  serviceType: 'marketing_retainer',
  dueDate: '',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nextProjects, nextClients] = await Promise.all([listProjects(), getClients()]);
      setProjects(nextProjects);
      setClients(nextClients);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar projetos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const summary = useMemo(() => ({
    total: projects.length,
    active: projects.filter((project) => project.status === 'active').length,
    blocked: projects.filter((project) => project.status === 'blocked').length,
  }), [projects]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createProject({
        clientId: form.clientId,
        name: form.name || undefined,
        serviceType: form.serviceType || undefined,
        dueDate: form.dueDate || null,
      });
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao criar projeto'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Projetos' }]}
      title="Projetos e Entregas"
      description="A Onda 2 nasce a partir do contrato ativo e organiza milestones, entregáveis e prazo por cliente."
      meta={(
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {summary.total}</div>
          <div className="signal-chip">Ativos {summary.active}</div>
          <div className="signal-chip">Bloqueados {summary.blocked}</div>
        </div>
      )}
      actions={(
        <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      )}
    >
      <div className="space-y-8">
        {error && (
          <Reveal>
            <div className="edge-card border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
          </Reveal>
        )}

        <SectionHeader
          title="Criar projeto"
          subtitle="Projeto por cliente, sem capacity planning, usando template simples por tipo de serviço."
          icon={FolderKanban}
        />

        <Reveal>
          <form onSubmit={handleCreate} className="grid gap-4 edge-card p-5 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cliente</label>
              <select
                value={form.clientId}
                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                className="h-9 rounded-[2px] border border-input bg-transparent px-3 text-sm"
                required
              >
                <option value="">Selecione</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Nome</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Execução mensal" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Serviço</label>
              <select
                value={form.serviceType}
                onChange={(event) => setForm((current) => ({ ...current, serviceType: event.target.value }))}
                className="h-9 rounded-[2px] border border-input bg-transparent px-3 text-sm"
              >
                <option value="marketing_retainer">Retainer</option>
                <option value="landing_page">Landing Page</option>
                <option value="paid_media">Paid Media</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Prazo</label>
              <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <Button type="submit" disabled={submitting || !form.clientId}>
                <Plus className="h-4 w-4" />
                Criar projeto
              </Button>
            </div>
          </form>
        </Reveal>

        <SectionHeader
          title="Portfólio de execução"
          subtitle="Projetos ligados à operação atual da agência."
          icon={Milestone}
        />

        <Reveal delayMs={80}>
          {loading ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando projetos...</div>
          ) : projects.length === 0 ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Nenhum projeto criado ainda.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {projects.map((project) => (
                <div key={project.id} className="edge-card hover-lift relative p-5">
                  <div className="absolute left-0 top-0 h-full w-[2px] rounded-l-sm bg-primary/40" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[project.status]}>{statusLabel[project.status]}</Badge>
                        <Badge variant="outline">{project.serviceType}</Badge>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.client.name}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>Detalhar</Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Início</p>
                      <p className="text-sm">{formatDate(project.startDate, 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Prazo</p>
                      <p className="text-sm">{formatDate(project.dueDate, 'dd/MM/yyyy', 'Sem prazo')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Milestones</p>
                      <p className="text-sm">{project.milestones?.length ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Entregáveis</p>
                      <p className="text-sm">{project.deliverables?.length ?? 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </PageShell>
  );
}
