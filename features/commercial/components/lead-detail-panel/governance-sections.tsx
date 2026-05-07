'use client';

import { useState } from 'react';
import {
  CommercialAsset,
  CommercialLead,
  CommercialLeadStatus,
  CommercialRequirementStatus,
} from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { COLUMNS } from '@/features/commercial/hooks/use-comercial';
import { Section } from './primitives';

interface RequirementChecklistSectionProps {
  lead: CommercialLead;
  saving: boolean;
  leadMetaLoading: boolean;
  requirements: CommercialRequirementStatus[];
  canManageSensitive: boolean;
  onUpdateRequirementStatus: (lead: CommercialLead, requirementKey: string, status: 'pending' | 'done' | 'waived') => void;
}

export function RequirementChecklistSection({
  lead,
  saving,
  leadMetaLoading,
  requirements,
  canManageSensitive,
  onUpdateRequirementStatus,
}: RequirementChecklistSectionProps) {
  return (
    <Section title="Checklist de Requisitos">
      {leadMetaLoading ? (
        <p className="text-xs text-muted-foreground">Carregando requisitos...</p>
      ) : requirements.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum requisito encontrado para o estágio atual.</p>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => (
            <div key={req.requirementId} className="rounded-lg border border-border/40 bg-background/20 p-2 space-y-1">
              <p className="text-[11px] text-foreground/90">{req.requirementKey}</p>
              {req.reason && <p className="text-[10px] text-muted-foreground">{req.reason}</p>}
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  'text-[10px] uppercase tracking-wide',
                  req.satisfied ? 'text-emerald-400' : 'text-amber-300',
                )}>
                  {req.status}
                </span>
                {canManageSensitive && (
                  <select
                    className="h-6 rounded border border-input bg-transparent px-2 text-[10px] cursor-pointer"
                    value={req.status}
                    onChange={(e) => onUpdateRequirementStatus(lead, req.requirementKey, e.target.value as 'pending' | 'done' | 'waived')}
                    disabled={saving}
                  >
                    <option value="pending">pending</option>
                    <option value="done">done</option>
                    <option value="waived">waived</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

interface LeadAssetsSectionProps {
  lead: CommercialLead;
  saving: boolean;
  leadMetaLoading: boolean;
  assets: CommercialAsset[];
  onAddAsset: (lead: CommercialLead, payload: { stage: CommercialLeadStatus; assetType: string; url: string }) => void;
}

export function LeadAssetsSection({
  lead,
  saving,
  leadMetaLoading,
  assets,
  onAddAsset,
}: LeadAssetsSectionProps) {
  const [assetType, setAssetType] = useState('proposal');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetStage, setAssetStage] = useState<CommercialLeadStatus>('proposta_enviada');

  return (
    <Section title="Assets / Documentos">
      {leadMetaLoading ? (
        <p className="text-xs text-muted-foreground">Carregando assets...</p>
      ) : assets.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem assets registrados.</p>
      ) : (
        <div className="space-y-1.5">
          {assets.slice(0, 5).map((asset) => (
            <a
              key={asset.id}
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border/40 bg-background/20 px-2 py-1.5 text-[11px] hover:border-border/70"
            >
              <p className="text-foreground/90">{asset.assetType} · {asset.stage}</p>
              <p className="text-muted-foreground">v{asset.version}</p>
            </a>
          ))}
        </div>
      )}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <select
            className="h-7 rounded border border-input bg-transparent px-2 text-[11px] cursor-pointer"
            value={assetStage}
            onChange={(e) => setAssetStage(e.target.value as CommercialLeadStatus)}
          >
            {COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
          <input
            className="h-7 rounded border border-input bg-transparent px-2 text-[11px]"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            placeholder="asset type"
          />
        </div>
        <input
          className="h-7 w-full rounded border border-input bg-transparent px-2 text-[11px]"
          value={assetUrl}
          onChange={(e) => setAssetUrl(e.target.value)}
          placeholder="https://..."
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] w-full cursor-pointer"
          disabled={saving || !assetType.trim() || !assetUrl.trim()}
          onClick={() => {
            onAddAsset(lead, { stage: assetStage, assetType: assetType.trim(), url: assetUrl.trim() });
            setAssetUrl('');
          }}
        >
          Registrar asset
        </Button>
      </div>
    </Section>
  );
}
