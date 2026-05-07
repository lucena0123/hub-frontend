'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { CheckpointFilter, OpsItem } from '../model';

type CheckpointState = {
  ready24: boolean;
  ready48: boolean;
  pending: boolean;
};

type MandatoryClientGroup = {
  clientId: string;
  clientName: string;
  total: number;
  ready48: number;
};

interface MandatoryValidationPanelProps {
  items: OpsItem[];
  groups: MandatoryClientGroup[];
  checkpointStateFor: (id: string) => CheckpointState;
  onCheckpointFilterChange: (value: CheckpointFilter) => void;
}

export function MandatoryValidationPanel({
  items,
  groups,
  checkpointStateFor,
  onCheckpointFilterChange,
}: MandatoryValidationPanelProps) {
  return (
    <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-amber-200">Ações obrigatórias de validação (24h/48h)</p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px]"
          onClick={() => onCheckpointFilterChange('mandatory')}
        >
          Ver só obrigatórias
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-amber-100/80">Sem ações obrigatórias no momento.</p>
      ) : (
        <>
          <div className="grid gap-1">
            {items.map((item) => {
              const checkpoint = checkpointStateFor(item.id);
              return (
                <a
                  key={`must:${item.id}`}
                  href={`#card-${item.id.replace(':', '-')}`}
                  className="text-xs text-amber-100/90 hover:underline"
                >
                  • {checkpoint.ready48 ? '[48h]' : '[24h]'} {item.clientName} · {item.campaignName}
                </a>
              );
            })}
          </div>

          <div className="pt-1 border-t border-amber-400/20">
            <p className="text-[11px] text-amber-100/80 mb-1">O que validar agora por cliente</p>
            <div className="flex flex-wrap gap-1">
              {groups.map((group) => (
                <Link
                  key={`must-client:${group.clientId}`}
                  href={`/meta-ops?clientId=${group.clientId}&checkpoint=mandatory`}
                  className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100 hover:bg-amber-500/15"
                >
                  {group.clientName} · {group.total} ({group.ready48} em 48h)
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
