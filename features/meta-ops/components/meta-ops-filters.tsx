'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { Client } from '@/types';
import type { CheckpointFilter, OpsItem, OpsStatus } from '../model';

interface MetaOpsFiltersProps {
  clients: Client[];
  clientFilter: string;
  priorityFilter: 'all' | OpsItem['priority'];
  confidenceFilter: 'all' | OpsItem['confidence'];
  statusFilter: 'all' | OpsStatus;
  checkpointFilter: CheckpointFilter;
  onClientFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: 'all' | OpsItem['priority']) => void;
  onConfidenceFilterChange: (value: 'all' | OpsItem['confidence']) => void;
  onStatusFilterChange: (value: 'all' | OpsStatus) => void;
  onCheckpointFilterChange: (value: CheckpointFilter) => void;
}

export function MetaOpsFilters({
  clients,
  clientFilter,
  priorityFilter,
  confidenceFilter,
  statusFilter,
  checkpointFilter,
  onClientFilterChange,
  onPriorityFilterChange,
  onConfidenceFilterChange,
  onStatusFilterChange,
  onCheckpointFilterChange,
}: MetaOpsFiltersProps) {
  return (
    <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 flex flex-wrap items-center gap-2">
      <select
        value={clientFilter}
        onChange={(event) => onClientFilterChange(event.target.value)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
      >
        <option value="all">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </select>

      <select
        value={priorityFilter}
        onChange={(event) => onPriorityFilterChange(event.target.value as 'all' | OpsItem['priority'])}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
      >
        <option value="all">Prioridade: todas</option>
        <option value="critical">Prioridade: critical</option>
        <option value="warning">Prioridade: warning</option>
      </select>

      <select
        value={confidenceFilter}
        onChange={(event) => onConfidenceFilterChange(event.target.value as 'all' | OpsItem['confidence'])}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
      >
        <option value="all">Confiança: todas</option>
        <option value="alta">Confiança: alta</option>
        <option value="média">Confiança: média</option>
      </select>

      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as 'all' | OpsStatus)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
      >
        <option value="all">Status: todos</option>
        <option value="pendente">Pendente</option>
        <option value="em_execucao">Em execução</option>
        <option value="implementado">Implementado</option>
        <option value="validado_ganhou">Validado (ganhou)</option>
        <option value="validado_neutro">Validado (neutro)</option>
        <option value="validado_piorou">Validado (piorou)</option>
      </select>

      <select
        value={checkpointFilter}
        onChange={(event) => onCheckpointFilterChange(event.target.value as CheckpointFilter)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
      >
        <option value="all">Checkpoint: todos</option>
        <option value="mandatory">Checkpoint: obrigatórias (24h/48h)</option>
        <option value="pending">Checkpoint: pendente</option>
        <option value="ready24">Checkpoint: pronto 24h</option>
        <option value="ready48">Checkpoint: pronto 48h</option>
      </select>

      <Button asChild variant="outline" size="sm"><Link href="/summary">Resumo</Link></Button>
      <Button asChild variant="outline" size="sm"><Link href="/alerts">Alertas</Link></Button>
      <Button asChild variant="outline" size="sm"><Link href="/tasks">Tarefas</Link></Button>
    </div>
  );
}
