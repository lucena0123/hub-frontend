'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { OpsItem, OpsStatus } from '../model';

interface MetaOpsItemActionsProps {
  hasImplementationTimestamp: (id: string) => boolean;
  item: OpsItem;
  onSetItemStatus: (id: string, status: OpsStatus) => void;
}

export function MetaOpsItemActions({
  hasImplementationTimestamp,
  item,
  onSetItemStatus,
}: MetaOpsItemActionsProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
          <Link href={`/clients/${item.clientId}/performance`}>Diagnóstico</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
          <Link href={`/optimization/settings?clientId=${item.clientId}`}>Regras</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
          <Link href={`/optimization/board?clientId=${item.clientId}`}>Board</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" className="h-7 text-[10px]" variant="outline" onClick={() => onSetItemStatus(item.id, 'pendente')}>
          Pendente
        </Button>
        <Button size="sm" className="h-7 text-[10px]" variant="outline" onClick={() => onSetItemStatus(item.id, 'em_execucao')}>
          Em execução
        </Button>
        <Button size="sm" className="h-7 text-[10px]" variant="outline" onClick={() => onSetItemStatus(item.id, 'implementado')}>
          <ClipboardCheck className="h-3 w-3 mr-1" /> Implementado
        </Button>
        <Button size="sm" className="h-7 text-[10px]" variant="outline" disabled={!hasImplementationTimestamp(item.id)} onClick={() => onSetItemStatus(item.id, 'validado_ganhou')}>
          Validou: ganhou
        </Button>
        <Button size="sm" className="h-7 text-[10px]" variant="outline" disabled={!hasImplementationTimestamp(item.id)} onClick={() => onSetItemStatus(item.id, 'validado_neutro')}>
          Validou: neutro
        </Button>
        <Button size="sm" className="h-7 text-[10px]" variant="outline" disabled={!hasImplementationTimestamp(item.id)} onClick={() => onSetItemStatus(item.id, 'validado_piorou')}>
          Validou: piorou
        </Button>
      </div>
    </>
  );
}
