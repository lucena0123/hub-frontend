'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, FolderKanban, Milestone, Plus, RefreshCw, Workflow } from 'lucide-react';

import {
  createDeliverable,
  createMilestone,
  getProject,
  updateDeliverable,
  type Deliverable,
  type Project,
} from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

const statusClass: Record<Deliverable['status'], string> = {
  planned: 'bg-blue-500/15 text-blue-300',
  active: 'bg-primary/15 text-primary',
  blocked: 'bg-destructive/15 text-destructive',
  done: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-muted text-muted-foreground',
};

const statusLabel: Record<Deliverable['status'], string> = {
  planned: 'Planejado',
  active: 'Em execução',
  blocked: 'Bloqueado',
  done: 'Concluído',
  cancelled: 'Cancelado',
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [deliverableForm, setDeliverableForm] = useState({
    milestoneId: '',
    name: '',
    description: '',
    dueDate: '',
  });

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar projeto'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const handleCreateMilestone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) return;
    try {
      setBusy(true);
      await createMilestone(projectId, {
        name: milestoneName,
        dueDate: milestoneDueDate || null,
      });
      setMilestoneName('');
      setMilestoneDueDate('');
      await loadProject();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao criar milestone'));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateDeliverable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) return;
    try {
      setBusy(true);
      await createDeliverable({
        projectId,
        milestoneId: deliverableForm.milestoneId || null,
        name: deliverableForm.name,
        description: deliverableForm.description || null,
        dueDate: deliverableForm.dueDate || null,
      });
      setDeliverableForm({ milestoneId: '', name: '', description: '', dueDate: '' });
      await loadProject();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao criar entregável'));
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (deliverableId: string, status: Deliverable['status']) => {
    if (!projectId) return;
    try {
      setBusy(true);
      await updateDeliverable(deliverableId, { status });
      await loadProject();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao atualizar entregável'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Projetos', href: '/projects' }, { label: project?.name ?? 'Detalhe' }]}
      title={project?.name ?? 'Projeto'}
      description="Detalhe operacional da Onda 2 com milestones, entregáveis e status de execução."
      meta={project ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Cliente {project.client.name}</div>
          <div className="signal-chip">Milestones {project.milestones?.length ?? 0}</div>
          <div className="signal-chip">Entregáveis {project.deliverables?.length ?? 0}</div>
        </div>
      ) : null}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">Voltar</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadProject()} disabled={loading || busy}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      )}
    >
      <div className="space-y-8">
        {error && (
          <Reveal>
            <div className="edge-card border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
          </Reveal>
        )}

        {loading || !project ? (
          <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando projeto...</div>
        ) : (
          <>
            <SectionHeader
              title="Resumo"
              subtitle="Cliente, contrato de origem e prazo operacional."
              icon={FolderKanban}
            />

            <Reveal>
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="edge-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cliente</p>
                  <p className="mt-2 text-sm font-medium">{project.client.name}</p>
                </div>
                <div className="edge-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contrato</p>
                  <p className="mt-2 text-sm font-medium">{project.contract?.title ?? 'Sem vínculo'}</p>
                </div>
                <div className="edge-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Início</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(project.startDate, 'dd/MM/yyyy')}</p>
                </div>
                <div className="edge-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Prazo</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(project.dueDate, 'dd/MM/yyyy', 'Sem prazo')}</p>
                </div>
              </div>
            </Reveal>

            <SectionHeader
              title="Milestones"
              subtitle="Quebre a execução em etapas curtas."
              icon={Milestone}
            />

            <Reveal delayMs={80}>
              <form onSubmit={handleCreateMilestone} className="grid gap-4 edge-card p-5 lg:grid-cols-[1.2fr_0.8fr_auto]">
                <Input value={milestoneName} onChange={(event) => setMilestoneName(event.target.value)} placeholder="Nova milestone" required />
                <Input type="date" value={milestoneDueDate} onChange={(event) => setMilestoneDueDate(event.target.value)} />
                <Button type="submit" disabled={busy || !milestoneName.trim()}>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </form>
            </Reveal>

            <Reveal delayMs={120}>
              <div className="grid gap-4 xl:grid-cols-2">
                {(project.milestones ?? []).map((milestone) => (
                  <div key={milestone.id} className="edge-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{milestone.name}</p>
                        <p className="text-xs text-muted-foreground">Prazo {formatDate(milestone.dueDate, 'dd/MM/yyyy', 'Sem data')}</p>
                      </div>
                      <Badge variant="outline">#{milestone.orderIndex + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <SectionHeader
              title="Entregáveis"
              subtitle="Acompanhe o que está planejado, bloqueado ou concluído."
              icon={Workflow}
            />

            <Reveal delayMs={160}>
              <form onSubmit={handleCreateDeliverable} className="grid gap-4 edge-card p-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Milestone</label>
                  <select
                    value={deliverableForm.milestoneId}
                    onChange={(event) => setDeliverableForm((current) => ({ ...current, milestoneId: event.target.value }))}
                    className="h-9 rounded-[2px] border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Sem milestone</option>
                    {(project.milestones ?? []).map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Prazo</label>
                  <Input type="date" value={deliverableForm.dueDate} onChange={(event) => setDeliverableForm((current) => ({ ...current, dueDate: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Nome</label>
                  <Input value={deliverableForm.name} onChange={(event) => setDeliverableForm((current) => ({ ...current, name: event.target.value }))} placeholder="Entrega principal" required />
                </div>
                <div className="space-y-2 lg:row-span-2">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Descrição</label>
                  <Textarea value={deliverableForm.description} onChange={(event) => setDeliverableForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24" placeholder="Observações do entregável" />
                </div>
                <div className="lg:col-span-2 flex justify-end">
                  <Button type="submit" disabled={busy || !deliverableForm.name.trim()}>
                    <CheckCircle2 className="h-4 w-4" />
                    Criar entregável
                  </Button>
                </div>
              </form>
            </Reveal>

            <Reveal delayMs={200}>
              <div className="space-y-4">
                {(project.deliverables ?? []).map((deliverable) => (
                  <div key={deliverable.id} className="edge-card hover-lift p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={statusClass[deliverable.status]}>{statusLabel[deliverable.status]}</Badge>
                          {deliverable.milestoneId && <Badge variant="outline">Com milestone</Badge>}
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{deliverable.name}</p>
                          <p className="text-sm text-muted-foreground">{deliverable.description || 'Sem descrição operacional.'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => void handleStatusChange(deliverable.id, 'active')} disabled={busy}>
                          Iniciar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleStatusChange(deliverable.id, 'blocked')} disabled={busy}>
                          Bloquear
                        </Button>
                        <Button size="sm" onClick={() => void handleStatusChange(deliverable.id, 'done')} disabled={busy}>
                          Concluir
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Prazo</p>
                        <p className="text-sm">{formatDate(deliverable.dueDate, 'dd/MM/yyyy', 'Sem data')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bloqueio</p>
                        <p className="text-sm">{deliverable.blockedReason || 'Sem bloqueio registrado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Work items</p>
                        <p className="text-sm">{project.workItems?.filter((item) => item.deliverableId === deliverable.id).length ?? 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </>
        )}
      </div>
    </PageShell>
  );
}
